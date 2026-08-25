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
SITE_URL=https://your-domain.com
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
'callback_url' => 'https://your-domain.com/give/thank-you/',
'notify_email' => 'wordsofeternalifemin@gmail.com',
```

Nothing above the web root can be requested over HTTP, so even if PHP stops
executing — a misconfiguration that has exposed plenty of other sites — the
key cannot be read.

## 5. Set the PHP version

In cPanel → **MultiPHP Manager**, set the domain to **PHP 7.4 or newer**. The
files target 7.4 deliberately, so anything from 7.4 to 8.3 works. Make sure
`curl` is enabled (it is by default).

## 6. Point Paystack's webhook at the site

Paystack Dashboard → Settings → API Keys & Webhooks → **Webhook URL**:

```
https://your-domain.com/api/paystack/webhook.php
```

The webhook is the only trustworthy confirmation that money moved — the
browser redirect can be faked, or never happen if someone closes the tab. It
verifies every request against your secret key before believing it.

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
