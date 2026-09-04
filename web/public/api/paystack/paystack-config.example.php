<?php
/**
 * Copy this to `paystack-config.php` and place it ABOVE the web root — the
 * same level as public_html, NOT inside it. Nothing above the web root can be
 * requested over HTTP, so the secret key cannot leak even if PHP stops
 * executing (a misconfiguration that has exposed plenty of other sites).
 *
 * Never commit the real file. It is gitignored.
 */

return [
    // Paystack Dashboard -> Settings -> API Keys & Webhooks.
    // Start with the sk_test_... key and only swap in sk_live_... once a test
    // payment has gone through end to end.
    'secret_key' => 'sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',

    'currency' => 'GHS',

    // Split settlement (optional). Leave empty for a single account.
    //
    // IMPORTANT: subaccount codes are mode-specific. The code below was
    // created in one mode — a live-mode code will be rejected by test keys,
    // and vice versa. Keep the code and the secret key in the same mode.
    //
    // The split percentage itself is set on the subaccount in the Paystack
    // dashboard, not here.
    'subaccount' => 'ACCT_xelginy2o9fh37w',

    // Who pays Paystack's transaction fee: 'subaccount' or 'account'.
    // Leave null to use the Paystack default (the main account).
    'bearer' => null,

    // Optional flat amount in PESEWAS kept by the main account before the
    // split. 0 or null to disable. (100 pesewas = GHS 1.00)
    'transaction_charge' => null,


    // Where Paystack sends the giver after checkout.
    'callback_url' => 'https://kingdomofgods.org/give/thank-you/',

    // Optional: emailed whenever a gift is received.
    'notify_email' => '',
    'mail_from' => 'no-reply@kingdomofgods.org',

    // ------------------------------------------------------------------
    // Webhook fan-out.
    //
    // Paystack allows ONE webhook URL per account per mode, and this account
    // also serves the bookshop. Register webhook-router.php with Paystack and
    // list every destination here; the router forwards each event to all of
    // them, signature intact.
    //
    // BEFORE changing anything in Paystack, copy the URL currently configured
    // there into `bookshop` below — that is the bookshop's live endpoint, and
    // it is the thing that breaks if it is lost.
    // ------------------------------------------------------------------
    'router_targets' => [
        'church'   => 'https://kingdomofgods.org/api/paystack/webhook.php',
        'bookshop' => '',  // <- paste the CURRENT Paystack webhook URL here first
    ],

    // Records any delivery that failed. Keep it above the web root.
    'router_log' => __DIR__ . '/paystack-router.log',

    // Written by webhook.php. Keep it above the web root.
    'log_file' => __DIR__ . '/paystack-giving.log',
];
