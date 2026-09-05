# The one file you place yourself

This holds the Paystack **secret key**, which is why it does not live in the
repo and has not passed through chat.

## Where it goes

**One level ABOVE `public_html`** — the same folder `public_html` sits in:

```
/home/kingddbn/
├── paystack-config.php     ← here
└── public_html/            ← the website
```

Nothing above `public_html` can be requested over the web, so the key cannot
be read even if PHP were to stop executing.

## What to put in it

Create `paystack-config.php` with exactly this, filling in the two blanks:

```php
<?php

return [
    // Paystack Dashboard → Settings → API Keys & Webhooks.
    // START WITH THE TEST KEY. Only swap to sk_live_ after a test payment
    // has gone all the way through.
    'secret_key' => 'sk_test_PASTE_YOURS_HERE',

    'currency' => 'GHS',

    // Where the giver lands after paying.
    'callback_url' => 'https://kingdomofgods.org/give/thank-you/',

    // Emailed when a gift arrives, and when a webhook fails to deliver.
    'notify_email' => 'wordsofeternallifemin@gmail.com',
    'mail_from'    => 'no-reply@kingdomofgods.org',

    // Split settlement. Subaccount codes are mode-specific: this one only
    // works with keys from the mode it was created in.
    'subaccount' => 'ACCT_xelginy2o9fh37w',

    // Who pays Paystack's fee: 'subaccount', 'account', or null for default.
    'bearer' => null,

    // Flat amount in PESEWAS the main account keeps before the split.
    'transaction_charge' => null,

    // Both destinations for the webhook fan-out. Paystack allows only one
    // webhook URL per account, and this account also serves the bookshop —
    // the router forwards every event to both.
    'router_targets' => [
        'church'   => 'https://kingdomofgods.org/api/paystack/webhook.php',
        'bookshop' => 'https://thefathershouseprints.kingdomofgods.org/api/payments/webhook',
    ],

    'log_file'   => __DIR__ . '/paystack-giving.log',
    'router_log' => __DIR__ . '/paystack-router.log',
];
```

## Check it worked

Once the site is up, this must NOT return the file:

```
https://kingdomofgods.org/../paystack-config.php   → should fail
```

The smoke test checks a related case automatically.

## When you go live later

Four values change together, in this one file:

1. `secret_key` → `sk_live_…`
2. `subaccount` → the **live-mode** subaccount code
3. In `web/.env`, `PUBLIC_PAYSTACK_PUBLIC_KEY` → `pk_live_…`, then rebuild
4. In Paystack, move the router URL from the **Test** webhook field to **Live**

Until all four match, giving will fail with an invalid-key or invalid-subaccount
error rather than taking money incorrectly.
