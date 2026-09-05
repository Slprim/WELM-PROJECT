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

/**
 * One call to the Paystack API. Returns [httpStatus, decodedBody].
 *
 * Kept deliberately small: the transaction call below builds its own request
 * because it needs the raw response for logging, while plan lookup and
 * creation only care about the decoded result.
 */
function paystack_request($method, $url, $secretKey, array $body = null)
{
    $ch = curl_init($url);
    $opts = [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $secretKey,
            'Content-Type: application/json',
            'Cache-Control: no-cache',
        ],
        CURLOPT_TIMEOUT => 20,
    ];
    if ($body !== null) {
        $opts[CURLOPT_POSTFIELDS] = json_encode($body);
    }
    curl_setopt_array($ch, $opts);

    $raw = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($raw === false) {
        return [0, null];
    }

    return [$status, json_decode((string) $raw, true)];
}

/**
 * Find the monthly plan for this fund and amount, creating it if it is the
 * first gift of that size.
 *
 * Paystack has no "find plan by name", so plans are listed and matched on a
 * deterministic name. A plan is one per (fund, amount) pair, which is how
 * Paystack models recurring charges - the amount lives on the plan, not on
 * the transaction.
 *
 * Returns a plan_code, or null if Paystack could not be reached or refused.
 */
function paystack_monthly_plan($secretKey, $fund, $amountMinor, $currency)
{
    $wanted = sprintf('welm-monthly-%s-%d', $fund, $amountMinor);

    // Look through existing plans first so a repeat amount reuses its plan.
    for ($page = 1; $page <= 5; $page++) {
        [$status, $body] = paystack_request(
            'GET',
            'https://api.paystack.co/plan?perPage=100&page=' . $page,
            $secretKey
        );
        if ($status !== 200 || empty($body['status']) || !is_array($body['data'] ?? null)) {
            break;
        }
        foreach ($body['data'] as $plan) {
            if (($plan['name'] ?? '') === $wanted && !empty($plan['plan_code'])) {
                return (string) $plan['plan_code'];
            }
        }
        if (count($body['data']) < 100) {
            break;
        }
    }

    [$status, $body] = paystack_request('POST', 'https://api.paystack.co/plan', $secretKey, [
        'name' => $wanted,
        'amount' => $amountMinor,
        'interval' => 'monthly',
        'currency' => $currency,
    ]);

    if ($status === 200 || $status === 201) {
        if (!empty($body['status']) && !empty($body['data']['plan_code'])) {
            return (string) $body['data']['plan_code'];
        }
    }

    error_log(sprintf(
        'paystack: could not create monthly plan %s (HTTP %d) %s',
        $wanted,
        $status,
        is_array($body) ? (string) ($body['message'] ?? '') : ''
    ));

    return null;
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

// ---------------------------------------------------------------------------
// Monthly giving.
//
// Paystack models recurring charges as a plan the giver is subscribed to, so
// the amount comes from the plan and overrides whatever is sent here. Passing
// the plan is what makes the first payment set up a subscription rather than
// a one-off charge.
//
// Paystack can only charge a SUBSCRIPTION to a bank card - mobile money
// cannot be debited automatically. Channels are therefore restricted to card
// for a monthly gift, so a giver is told on the checkout page rather than
// paying by MoMo and believing a monthly gift was set up when it was not.
// The form says the same thing before they get there.
// ---------------------------------------------------------------------------
if ($recurring) {
    // Paystack will not create a plan below GHS 2, and its own error reads
    // "Amount is invalid" - which tells a giver nothing. Catch it here and say
    // what to do instead. MIN_RECURRING_MINOR is in pesewas.
    $minRecurringMinor = 200;
    if ($amountMinor < $minRecurringMinor) {
        fail(422, sprintf(
            'A monthly gift needs to be %s %s or more. A smaller amount can still be given as a one-off gift.',
            $currency,
            number_format($minRecurringMinor / 100, 2)
        ));
    }

    $planCode = paystack_monthly_plan($config['secret_key'], $fund, $amountMinor, $currency);

    if ($planCode === null) {
        // Better to say monthly failed than to silently take a single gift
        // from someone who asked to give every month.
        fail(400, 'Monthly giving could not be set up just now. Please try again, or give a one-off gift and contact the church office.');
    }

    $payload['plan'] = $planCode;
    $payload['channels'] = ['card'];
    $payload['metadata']['recurring_plan'] = $planCode;
}

// ---------------------------------------------------------------------------
// Split settlement.
//
// When a subaccount is configured, Paystack settles the gift according to the
// split set on that subaccount in the dashboard — this endpoint does not
// decide the percentage, it only names the destination.
//
// Subaccount codes are mode-specific: one created in live mode is invalid
// against test keys and vice versa, so the code lives beside the secret key
// in paystack-config.php rather than in this file.
// ---------------------------------------------------------------------------
if (!empty($config['subaccount'])) {
    $payload['subaccount'] = $config['subaccount'];

    // Who pays Paystack's fee. 'subaccount' means it comes out of the
    // church's share; 'account' leaves it on the main account. Paystack
    // defaults to the main account when this is not sent.
    if (!empty($config['bearer'])) {
        $payload['bearer'] = $config['bearer'];
    }

    // Optional flat amount, in pesewas, kept by the main account before the
    // split. Only meaningful alongside a subaccount.
    if (isset($config['transaction_charge']) && $config['transaction_charge'] > 0) {
        $payload['transaction_charge'] = (int) $config['transaction_charge'];
    }
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
    // 400, not 502. Paystack answered - it simply refused the request, usually
    // a bad key or a subaccount from the wrong mode. Sending 502 would be
    // semantically wrong AND practically harmful: Cloudflare replaces the body
    // of a 5xx from the origin with its own error page, so the giver would see
    // a generic gateway error instead of what actually went wrong.
    fail(400, $decoded['message'] ?? 'The payment provider rejected the request.');
}

echo json_encode([
    'authorization_url' => $decoded['data']['authorization_url'],
    'reference' => $decoded['data']['reference'] ?? null,
]);
