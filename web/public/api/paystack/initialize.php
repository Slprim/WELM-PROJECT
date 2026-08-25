<?php
/**
 * Starts a Paystack transaction.
 *
 * The browser never sees the secret key and never handles card or mobile
 * money details. It posts an amount and an email here; this creates the
 * transaction server-side and returns Paystack's hosted checkout URL to
 * redirect to. That keeps the site entirely out of PCI scope.
 *
 * Config lives in paystack-config.php, which is NOT in version control and
 * should sit ABOVE the web root. See DEPLOY.md.
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

/**
 * Always answer JSON, never a stack trace with the key in it.
 *
 * No `never` return type: that is PHP 8.1+, and plenty of cPanel plans still
 * default to 7.4. Everything in these files targets 7.4.
 */
function fail($status, $message)
{
    http_response_code($status);
    echo json_encode(['error' => $message]);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    fail(405, 'Method not allowed.');
}

// Look above the web root first — that is where the key belongs.
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
    // Deliberately vague to the caller; specifics go to the server log.
    error_log('paystack: config missing or has no secret_key');
    fail(500, 'Giving is not configured yet.');
}

$raw = file_get_contents('php://input') ?: '';
$body = json_decode($raw, true);
if (!is_array($body)) {
    fail(400, 'Expected a JSON body.');
}

// ---------------------------------------------------------------------------
// Validate. Never trust the amount from the client beyond sanity-checking it —
// Paystack is told the figure, so a tampered value would charge that instead.
// ---------------------------------------------------------------------------
$email = filter_var(trim((string) ($body['email'] ?? '')), FILTER_VALIDATE_EMAIL);
if (!$email) {
    fail(422, 'A valid email address is required for the receipt.');
}

$amount = (float) ($body['amount'] ?? 0);
if ($amount <= 0) {
    fail(422, 'Enter an amount greater than zero.');
}
if ($amount > 1000000) {
    fail(422, 'That amount is too large to process online. Please contact the church office.');
}

$allowedFunds = ['tithe', 'offering', 'metadidomi', 'missions', 'building'];
$fund = (string) ($body['fund'] ?? 'offering');
if (!in_array($fund, $allowedFunds, true)) {
    $fund = 'offering';
}

$name = trim((string) ($body['name'] ?? ''));
// mbstring is usual on cPanel but not guaranteed.
$name = function_exists('mb_substr')
    ? mb_substr($name, 0, 120)
    : substr($name, 0, 120);
$recurring = !empty($body['recurring']);

// Paystack takes the smallest currency unit — pesewas for GHS.
$amountMinor = (int) round($amount * 100);

$currency = $config['currency'] ?? 'GHS';
$callback = $config['callback_url'] ?? null;

$payload = [
    'email' => $email,
    'amount' => $amountMinor,
    'currency' => $currency,
    'metadata' => [
        'fund' => $fund,
        'giver_name' => $name !== '' ? $name : null,
        'recurring_requested' => $recurring,
        'custom_fields' => [
            [
                'display_name' => 'Giving toward',
                'variable_name' => 'fund',
                'value' => ucfirst($fund),
            ],
        ],
    ],
];

if ($callback) {
    $payload['callback_url'] = $callback;
}

$ch = curl_init('https://api.paystack.co/transaction/initialize');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode($payload),
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . $config['secret_key'],
        'Content-Type: application/json',
        'Cache-Control: no-cache',
    ],
    CURLOPT_TIMEOUT => 20,
]);

$response = curl_exec($ch);
$status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($response === false) {
    error_log('paystack: curl failed - ' . $curlError);
    fail(502, 'Could not reach the payment provider. Please try again.');
}

$decoded = json_decode((string) $response, true);

if ($status !== 200 || empty($decoded['status']) || empty($decoded['data']['authorization_url'])) {
    error_log('paystack: initialize failed (' . $status . ') ' . (string) $response);
    fail(502, $decoded['message'] ?? 'The payment provider rejected the request.');
}

echo json_encode([
    'authorization_url' => $decoded['data']['authorization_url'],
    'reference' => $decoded['data']['reference'] ?? null,
]);
