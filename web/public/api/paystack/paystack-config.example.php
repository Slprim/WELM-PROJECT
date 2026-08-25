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

    // Where Paystack sends the giver after checkout.
    'callback_url' => 'https://YOUR-DOMAIN/give/thank-you/',

    // Optional: emailed whenever a gift is received.
    'notify_email' => '',
    'mail_from' => 'no-reply@YOUR-DOMAIN',

    // Written by webhook.php. Keep it above the web root.
    'log_file' => __DIR__ . '/paystack-giving.log',
];
