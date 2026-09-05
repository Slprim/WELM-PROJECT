<?php
/**
 * Confirms what actually happened to a transaction.
 *
 * Paystack redirects the giver to the callback URL whatever the outcome -
 * paid, cancelled or failed - so the thank-you page cannot tell them apart on
 * its own. It asks here, and this asks Paystack.
 *
 * Read-only: it looks a transaction up by reference and reports the status.
 * It moves no money and changes nothing. The webhook remains the record of a
 * gift; this only decides what the giver is shown.
 *
 * Config lives in paystack-config.php, ABOVE the web root. See DEPLOY.md.
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
// The answer is specific to one reference and must never be cached by a CDN.
header('Cache-Control: no-store');

function fail($status, $message)
{
    http_response_code($status);
    echo json_encode(['error' => $message]);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    fail(405, 'Method not allowed.');
}

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
    error_log('paystack verify: config missing or has no secret_key');
    fail(500, 'Giving is not configured yet.');
}

// Paystack references are its own alphanumerics, or the bookshop's longer
// ABK-... form. Validate the shape before putting it in a URL.
$reference = trim((string) ($_GET['reference'] ?? ''));
if ($reference === '' || !preg_match('/^[A-Za-z0-9._=-]{4,120}$/', $reference)) {
    fail(400, 'A valid transaction reference is required.');
}

$ch = curl_init('https://api.paystack.co/transaction/verify/' . rawurlencode($reference));
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . $config['secret_key'],
        'Cache-Control: no-cache',
    ],
    CURLOPT_TIMEOUT => 20,
]);

$response = curl_exec($ch);
$httpStatus = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

/**
 * Any failure to confirm - an unrecognised reference, Paystack unreachable,
 * a malformed answer - is reported as "unknown" with a 200.
 *
 * Never a 5xx. Cloudflare sits in front of this site and replaces the body of
 * a 5xx from the origin with its own HTML error page, so the caller would get
 * markup instead of JSON and could not tell "not found" from "provider down".
 * The page treats "unknown" as "say nothing we cannot stand behind", which is
 * the right wording for every one of these cases. The distinction that
 * matters operationally goes to the log instead.
 */
function unknown($why)
{
    if ($why !== '') {
        error_log('paystack verify: ' . $why);
    }
    echo json_encode(['status' => 'unknown']);
    exit;
}

if ($response === false) {
    unknown('curl failed - ' . $curlError);
}

$decoded = json_decode((string) $response, true);

if ($httpStatus !== 200 || empty($decoded['status']) || !is_array($decoded['data'] ?? null)) {
    // 404 is the ordinary "no such reference" and is not worth logging.
    unknown($httpStatus === 404 ? '' : 'lookup failed (' . $httpStatus . ') ' . substr((string) $response, 0, 300));
}

$data = $decoded['data'];
$status = (string) ($data['status'] ?? 'unknown');

// Only ever report back what the page needs to choose its wording. No
// customer record, no authorization data, nothing that could identify
// someone else's gift to whoever holds the reference.
$out = [
    'status' => $status,
    'amount' => ((int) ($data['amount'] ?? 0)) / 100,
    'currency' => (string) ($data['currency'] ?? 'GHS'),
];

if ($status === 'success') {
    $fund = (string) ($data['metadata']['fund'] ?? '');
    $allowedFunds = ['tithe', 'offering', 'metadidomi', 'missions', 'building'];
    if (in_array($fund, $allowedFunds, true)) {
        $out['fund'] = $fund;
    }
    $out['recurring'] = !empty($data['metadata']['recurring_plan']);
}

echo json_encode($out);
