<?php
/**
 * Paystack webhook fan-out.
 *
 * Paystack allows exactly ONE webhook URL per account per mode. This account
 * serves both the church giving on kingdomofgods.org and the bookshop on
 * thefathershouseprints.kingdomofgods.org, so pointing the single URL at
 * either one would silently stop the other from being told about payments —
 * no error, orders or gifts just never get marked paid.
 *
 * This endpoint is registered with Paystack instead, and forwards every event
 * to each configured destination.
 *
 * Two rules make that safe:
 *
 * 1. The body is forwarded BYTE-IDENTICAL along with the original
 *    x-paystack-signature header. The signature is an HMAC of the exact raw
 *    body, so re-encoding or pretty-printing it would break verification
 *    everywhere downstream.
 * 2. Each destination still verifies the signature itself. The router is a
 *    delivery mechanism, not a trust boundary — a destination must never
 *    assume a request is genuine merely because the router sent it.
 *
 * Paystack is answered 200 immediately and the forwarding happens after,
 * because Paystack retries anything slow or non-200 and a retry would deliver
 * the event twice to whichever destination already succeeded.
 */

declare(strict_types=1);

$configPaths = [
    __DIR__ . '/../../../paystack-config.php',
    __DIR__ . '/../../paystack-config.php',
    __DIR__ . '/paystack-config.php',
];

$config = null;
foreach ($configPaths as $path) {
    if (is_readable($path)) {
        $config = require $path;
        break;
    }
}

if (!is_array($config) || empty($config['secret_key'])) {
    error_log('paystack router: config missing');
    http_response_code(500);
    exit;
}

$raw = file_get_contents('php://input') ?: '';
$signature = $_SERVER['HTTP_X_PAYSTACK_SIGNATURE'] ?? '';
$expected = hash_hmac('sha512', $raw, $config['secret_key']);

// Reject anything unsigned here so junk is never fanned out to the
// destinations. hash_equals, not ===, so the comparison cannot be timed.
if ($signature === '' || !hash_equals($expected, $signature)) {
    error_log('paystack router: bad signature from ' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'));
    http_response_code(401);
    exit;
}

// Answer Paystack before doing any forwarding.
http_response_code(200);
echo 'ok';
if (function_exists('fastcgi_finish_request')) {
    fastcgi_finish_request();
}

$targets = $config['router_targets'] ?? [];
if (!is_array($targets) || count($targets) === 0) {
    error_log('paystack router: no router_targets configured; event not delivered anywhere');
    exit;
}

$headers = [
    'Content-Type: application/json',
    'x-paystack-signature: ' . $signature,
    'User-Agent: WELM-Paystack-Router/1.0',
];

// Forward in parallel so one slow destination does not delay the other.
$multi = curl_multi_init();
$handles = [];

foreach ($targets as $name => $url) {
    if (!is_string($url) || $url === '') {
        continue;
    }
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $raw,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_CONNECTTIMEOUT => 8,
        // Follow a redirect, since a host may bounce http -> https.
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS => 3,
    ]);
    curl_multi_add_handle($multi, $ch);
    $handles[is_string($name) ? $name : $url] = ['handle' => $ch, 'url' => $url];
}

$running = null;
do {
    curl_multi_exec($multi, $running);
    if ($running > 0) {
        curl_multi_select($multi, 1.0);
    }
} while ($running > 0);

$event = json_decode($raw, true);
$reference = is_array($event) ? ($event['data']['reference'] ?? '') : '';
$eventType = is_array($event) ? ($event['event'] ?? '') : '';

$failures = [];
foreach ($handles as $name => $entry) {
    $ch = $entry['handle'];
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_multi_remove_handle($multi, $ch);
    curl_close($ch);

    if ($status < 200 || $status >= 300) {
        $failures[] = sprintf(
            '%s (%s) -> HTTP %d%s',
            $name,
            $entry['url'],
            $status,
            $err !== '' ? ' ' . $err : ''
        );
    }
}
curl_multi_close($multi);

// A lost delivery is invisible unless it is recorded, so failures are written
// down and, if configured, emailed. Paystack is NOT asked to retry: it would
// redeliver to the destination that already succeeded, which for the bookshop
// could mean a duplicated order.
if (count($failures) > 0) {
    $line = sprintf(
        "%s  event=%s ref=%s  FAILED: %s\n",
        gmdate('c'),
        $eventType,
        $reference,
        implode(' | ', $failures)
    );

    $logFile = $config['router_log'] ?? (__DIR__ . '/../../../paystack-router.log');
    @file_put_contents($logFile, $line, FILE_APPEND | LOCK_EX);
    error_log('paystack router: ' . trim($line));

    if (!empty($config['notify_email'])) {
        @mail(
            $config['notify_email'],
            'Paystack webhook delivery failed',
            "A Paystack event could not be delivered to every destination.\n\n"
                . "Event:     {$eventType}\n"
                . "Reference: {$reference}\n\n"
                . implode("\n", $failures)
                . "\n\nThe payment itself is unaffected. The destination above was not told about it,"
                . "\nso an order or gift may need marking manually.\n",
            'From: ' . ($config['mail_from'] ?? 'no-reply@' . ($_SERVER['HTTP_HOST'] ?? 'localhost'))
        );
    }
}
