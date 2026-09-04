# Deploying to Namecheap cPanel hosting

The site is static HTML plus two small PHP files for giving. Nothing needs
Node on the server.

Read [PUBLISHING.md](PUBLISHING.md) first if you have not — the key thing
about shared hosting is that **publishing in Sanity does not update the live
site on its own**. Someone has to rebuild and re-upload. That is the one real
cost of this hosting choice.

---

## 1. Set the domain

In `web/.env`:

```
SITE_URL=https://kingdomofgods.org
SANITY_PROJECT_ID=oqhf83r1
SANITY_DATASET=production
```

`SITE_URL` is what the sitemap, `robots.txt` and the canonical/social tags are
written against. Get it right before the first production build or search
engines index the wrong host.

## 2. Build

```bash
cd web
npm install
npm run build
```

Everything to upload is in `web/dist/`.

## 3. Upload

Put the **contents** of `web/dist/` into `public_html/` — the files
themselves, not the `dist` folder.

```
public_html/
├── .htaccess          ← must be uploaded; FTP clients often hide dotfiles
├── index.html
├── 404.html
├── robots.txt
├── sitemap-index.xml
├── _astro/
├── api/paystack/
└── …
```

**Turn on "show hidden files"** in cPanel File Manager or FileZilla, or
`.htaccess` will be silently left behind — and with it HTTPS redirects, the
404 page, compression and caching.

## 4. Put the Paystack secret above the web root

This is the part that matters most.

Copy `web/public/api/paystack/paystack-config.example.php` to
`paystack-config.php` and place it **one level above `public_html`**:

```
/home/youruser/
├── paystack-config.php    ← here. NOT reachable over HTTP.
└── public_html/
    └── api/paystack/…
```

Then delete `paystack-config.example.php` from `public_html/api/paystack/`.

Fill it in with your **test** keys first:

```php
'secret_key'   => 'sk_test_…',
'callback_url' => 'https://kingdomofgods.org/give/thank-you/',
'notify_email' => 'wordsofeternalifemin@gmail.com',
'subaccount'   => 'ACCT_xelginy2o9fh37w',
```

### About the subaccount

Gifts settle to the subaccount according to the split configured on it in the
Paystack dashboard. The site only names the destination — it does not set the
percentage.

**Subaccount codes are mode-specific.** `ACCT_xelginy2o9fh37w` was created in
one mode; a live-mode code is rejected by test keys and vice versa. If test
payments fail with an invalid-subaccount error, create the equivalent
subaccount in test mode and use that code while testing.

Two optional settings sit beside it:

- `'bearer'` — who pays Paystack's fee. `'subaccount'` takes it from the
  church's share, `'account'` leaves it on the main account. Left unset,
  Paystack charges the main account.
- `'transaction_charge'` — a flat amount in **pesewas** the main account keeps
  before the split. 100 = GHS 1.00. Leave unset for none.

Nothing above the web root can be requested over HTTP, so even if PHP stops
executing — a misconfiguration that has exposed plenty of other sites — the
key cannot be read.

## 5. Set the PHP version

In cPanel → **MultiPHP Manager**, set the domain to **PHP 7.4 or newer**. The
files target 7.4 deliberately, so anything from 7.4 to 8.3 works. Make sure
`curl` is enabled (it is by default).

## 6. Point Paystack's webhook at the router

**Read this section before touching anything in the Paystack dashboard.**

Paystack allows **one webhook URL per account, per mode**. This account also
serves the bookshop. If you simply replace the webhook URL with the church's
endpoint, Paystack stops calling the bookshop's URL — with no error. Its
orders would just quietly stop being marked paid.

So the church endpoint is not registered directly. A router is, and it
forwards every event to both.

Do it in this order:

**a. Confirm what is currently in Paystack.** Dashboard → Settings → API Keys
& Webhooks. It should read:

```
https://thefathershouseprints.kingdomofgods.org/api/payments/webhook
```

If it says anything else, that is the real bookshop endpoint — use it below
instead, and tell whoever maintains the bookshop.

**b. Both destinations are already set in the config template:**

```php
'router_targets' => [
    'church'   => 'https://kingdomofgods.org/api/paystack/webhook.php',
    'bookshop' => 'https://thefathershouseprints.kingdomofgods.org/api/payments/webhook',
],
```

The bookshop endpoint has been checked: it answers `401 Invalid signature` to
an unsigned POST, so it verifies for itself and does not depend on the router
being trustworthy.

**c. Only then change the Webhook URL in Paystack to:**

```
https://kingdomofgods.org/api/paystack/webhook-router.php
```

**d. Test the bookshop first, not the church.** Place a real bookshop order
(or resend a past event from Paystack Dashboard → Webhooks) and confirm it is
still fulfilled. The bookshop is the system with something to lose; the church
endpoint is new and has nothing to break.

Then test giving.

### If a delivery fails

The router answers Paystack 200 and forwards afterwards, so Paystack never
retries — a retry would deliver the event twice to whichever destination
already succeeded, which for the bookshop could mean a duplicated order.

Failures are instead written to `paystack-router.log` beside
`paystack-config.php`, and emailed to `notify_email` if it is set. The payment
itself is never affected; only the notification is lost, and the order or gift
can be marked manually.

### Why not just verify on the callback?

Because the browser redirect can be closed, blocked or never happen. The
webhook is the only delivery Paystack guarantees.

## 7. Enable HTTPS

cPanel → **SSL/TLS Status** → run AutoSSL. The `.htaccess` forces HTTPS, so
until the certificate exists the site will redirect to a broken padlock.

## 8. Test the giving flow before going live

With test keys in place, use Paystack's test card:

```
Card    4084 0840 8408 4081
Expiry  any future date
CVV     408
OTP     123456
```

Check all three:

1. The form redirects to Paystack
2. You land back on `/give/thank-you/`
3. The webhook fired — look for a line in `paystack-giving.log` (next to
   `paystack-config.php`), or check Paystack Dashboard → Webhooks for a 200

**Only when all three pass**, swap `sk_test_…` for `sk_live_…` in
`paystack-config.php` and `pk_test_…` for `pk_live_…` in `web/.env`, then
rebuild and re-upload. The test-mode banner disappears on its own.

---

## Updating content later

Because there is no build server, the loop is:

```bash
cd web
npm run build        # picks up whatever is published in Sanity
```

…then re-upload `dist/` to `public_html/`.

You only need to replace changed files. In practice `_astro/`, the HTML files
and `sitemap*.xml` are the ones that move; `api/` and `.htaccess` rarely
change.

### Worth knowing

If the manual re-upload becomes a chore — and it will, once staff are posting
sermons weekly — the site can move to Netlify without any code change, and
publishing would then rebuild and deploy on its own. The Namecheap domain
would just point there instead. The only piece that would need rewriting is
the two PHP files, which become JavaScript functions.

Nothing has to be decided now. It is a one-afternoon change whenever the
uploading gets old.
