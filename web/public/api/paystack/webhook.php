<?php
/**
 * Paystack webhook receiver.
 *
 * Paystack calls this when a transaction succeeds. It is the ONLY trustworthy
 * confirmation that money moved — the browser redirect after checkout can be
 * faked or simply never happen if the giver closes the tab, so nothing should
 * be recorded as paid on the strength of that alone.
 *
 * Every request is verified against the secret key via HMAC SHA512 before it
 * is believed. An unsigned or wrongly signed request is discarded.
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
    error_log('paystack webhook: config missing');
    http_response_code(500);
    exit;
}

$raw = file_get_contents('php://input') ?: '';
$signature = $_SERVER['HTTP_X_PAYSTACK_SIGNATURE'] ?? '';

$expected = hash_hmac('sha512', $raw, $config['secret_key']);

// hash_equals, not ===, so the comparison cannot be timed to leak the key.
if ($signature === '' || !hash_equals($expected, $signature)) {
    error_log('paystack webhook: bad signature from ' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'));
    http_response_code(401);
    exit;
}

// Acknowledge immediately. Paystack retries on anything slow or non-200, and
// a duplicate delivery is normal — treat handling as idempotent.
http_response_code(200);
echo 'ok';

if (function_exists('fastcgi_finish_request')) {
    fastcgi_finish_request();
}

$event = json_decode($raw, true);
if (!is_array($event)) {
    exit;
}

$type = (string) ($event['event'] ?? '');
$data = $event['data'] ?? [];

if ($type !== 'charge.success') {
    exit;
}

// This account also serves the bookshop, and the router forwards EVERY live
// event here - including shop orders. Only a transaction started by this
// site's initialize.php carries metadata.fund from its fixed allowlist, so
// that is what separates a gift from someone else's sale. Without this check
// a book order is written into the giving log as an "offering" and emailed to
// the church office as a gift.
$allowedFunds = ['tithe', 'offering', 'metadidomi', 'missions', 'building'];
$fund = (string) ($data['metadata']['fund'] ?? '');
if (!in_array($fund, $allowedFunds, true)) {
    exit;
}

$reference = (string) ($data['reference'] ?? '');
$amount = ((int) ($data['amount'] ?? 0)) / 100;
$currency = (string) ($data['currency'] ?? 'GHS');
$email = (string) ($data['customer']['email'] ?? '');
$name = (string) ($data['metadata']['giver_name'] ?? '');

// A flat log file, so there is a record even before any accounting system
// exists. Kept outside the web root and denied by .htaccess if it is not.
$logFile = $config['log_file'] ?? (__DIR__ . '/../../../paystack-giving.log');

$line = json_encode([
    'at' => gmdate('c'),
    'reference' => $reference,
    'amount' => $amount,
    'currency' => $currency,
    'fund' => $fund,
    'email' => $email,
    'name' => $name,
]) . PHP_EOL;

@file_put_contents($logFile, $line, FILE_APPEND | LOCK_EX);

// Notify the church office, if an address is configured.
if (!empty($config['notify_email'])) {
    $subject = sprintf('Giving received: %s %s (%s)', $currency, number_format($amount, 2), $fund);
    $body = "A gift has been received.\n\n"
        . "Amount:    {$currency} " . number_format($amount, 2) . "\n"
        . "Toward:    {$fund}\n"
        . "From:      " . ($name !== '' ? $name : 'Not given') . "\n"
        . "Email:     {$email}\n"
        . "Reference: {$reference}\n";

    @mail(
        $config['notify_email'],
        $subject,
        $body,
        'From: ' . ($config['mail_from'] ?? 'no-reply@' . ($_SERVER['HTTP_HOST'] ?? 'localhost'))
    );
}
