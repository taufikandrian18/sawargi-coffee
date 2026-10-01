# Sawargi on WordPress + WooCommerce (headless), on your own VPS

This site stays the storefront. WordPress + WooCommerce become the back office: batches, stock,
prices, orders and payments are all managed in WP admin, never in code.

Everything lives under one path of a domain your VPS already serves:

```
https://website.taufikandrian.my.id/sawargi-coffee/            the designed site (React, static)
https://website.taufikandrian.my.id/sawargi-coffee/shop/       WordPress + WooCommerce (cart, checkout, payments)
https://website.taufikandrian.my.id/sawargi-coffee/wp-admin    → redirects to …/shop/wp-admin/

Browser ──HTTPS──► front proxy container (n8n-caddy-1: owns ports 80/443 and the certificate)
                     └─ /sawargi-coffee* ──► sawargi-caddy:80 over the shared Docker network
                                                ├─ /sawargi-coffee/shop/* → PHP-FPM (WordPress) → MariaDB
                                                └─ everything else       → the built site, SPA fallback
```

The site reads batches and live stock from WooCommerce's public Store API (same origin, no keys
in the browser). "Continue to payment" hands the chosen batch, grind and quantity to
WooCommerce's own checkout, where delivery details and payment plugins run.

**Why WordPress sits under `/shop` and not at `/sawargi-coffee` itself:** both the site and
WooCommerce have a `/checkout` page, and WordPress owns every URL under its home path (payment
callbacks, cart, account, REST API). Sharing one path means a fragile list of which URLs belong
to whom; a separate `/shop` folder means one clean rule. The short `/sawargi-coffee/wp-admin` URL
still works (it redirects).

## What is managed where

| Thing | Where you change it |
| --- | --- |
| Batches (code, roast date, harvest, cup score, tasting notes, bags roasted) | WP admin → Products (the "Sawargi batch" box) |
| Stock (bags left) | WP admin → Products → Inventory tab. Falls automatically as orders are paid |
| Price | WP admin → Products → Variations |
| Grinds on offer | WP admin → Products → Variations (one per grind) |
| Orders, refunds, customers | WP admin → WooCommerce → Orders |
| Shipping rates | WP admin → WooCommerce → Settings → Shipping |
| Payments (QRIS, virtual accounts, cards) | A WooCommerce payment plugin, e.g. Midtrans or Xendit |
| Marketing copy, journal articles | Still in this repo (`src/content/copy.ts`, `src/pages/JournalPage.tsx`) |

## Why checkout happens on WooCommerce

Indonesian payment plugins are built for WooCommerce's own checkout page. Handing off there means
every plugin, every payment method and every plugin update just works.

The checkout still looks like the site. `wordpress/mu-plugins/sawargi-checkout.php` dresses
WooCommerce's checkout, cart, order-received and account pages in the site's look:
- the ink background, with paper cards in the batch-ticket shadow;
- cherry pill buttons;
- Big Shoulders, Readex Pro and IBM Plex Mono;
- a Sawargi header with a way back to the site, replacing the theme's own header.

After a **bank transfer** order (or cheque or cash on delivery), WooCommerce sends the buyer back
to the designed site's `/order-received` page. It shows the order, the amount to transfer, your bank
accounts and the payment reference, all taken from **WooCommerce → Settings → Payments → Direct
bank transfer**, so fill in your accounts there.

Online gateways like Midtrans or Xendit keep WooCommerce's own (styled) page, because they often
finish their work there. `wordpress/mu-plugins/sawargi-order-received.php` holds the list of
payment methods that come back to the site.

It targets WooCommerce's own class names, so it works with whichever theme is active. If a
WooCommerce update changes the checkout markup and something looks off, the fix belongs in that
file, not in the theme.

## 1. The VPS

- Ubuntu 22.04/24.04, **2 GB RAM minimum** (WooCommerce + MariaDB are heavy on 1 GB), 20 GB disk.
- The front proxy that already serves `website.taufikandrian.my.id` (a Caddy container,
  `n8n-caddy-1`, holding ports 80/443 and the certificates) stays as it is. This stack joins that
  container's Docker network (`PROXY_NETWORK`), and the proxy forwards `/sawargi-coffee` to it.
- Shared VPS: this stack adds roughly 300–500 MB in use (MariaDB is capped at a 64 MB buffer
  pool). Check `free -h` first: heavy swap use means slow admin pages and stalled commands.
- Docker with the compose plugin, git and rsync. Node is **not** needed on the VPS: the site is
  built inside a throwaway `node:22` container.

## 2. First deploy

```bash
cd /opt/sawargi-coffee
sudo chown -R "$USER": .                  # the scripts and the build write here as you, not root
cp deploy/.env.example deploy/.env
nano deploy/.env                          # DB passwords (openssl rand -base64 24), admin user + email
```

Set the database passwords **before** the first `docker compose up`: MariaDB keeps the password
it first starts with. If you already started it with the `change-me` placeholders, wipe the
empty stack first: `cd deploy && docker compose down -v`. That deletes all WordPress data, which
is fine only before you've added anything.

```bash
cd deploy && docker compose up -d && cd ..
./deploy/bootstrap-wordpress.sh           # installs WordPress + WooCommerce, IDR, batch category, Grind attribute
./deploy/build-site.sh                    # builds this site for /sawargi-coffee and publishes it
```

Then point the front proxy at the stack. Find its network and Caddyfile:

```bash
docker inspect n8n-caddy-1 --format '{{range $k, $v := .NetworkSettings.Networks}}{{$k}} {{end}}'
docker inspect n8n-caddy-1 --format '{{range .Mounts}}{{.Source}} -> {{.Destination}}{{"\n"}}{{end}}'
```

Put the network name in `PROXY_NETWORK` in `deploy/.env` and run `docker compose up -d` in `deploy/`.
Then add the block from `deploy/front-proxy.caddy` to the Caddyfile that the second command shows
(the one mounted at `/etc/caddy/Caddyfile`), and reload:

```bash
docker exec n8n-caddy-1 caddy validate --config /etc/caddy/Caddyfile
docker exec n8n-caddy-1 caddy reload --config /etc/caddy/Caddyfile
```

Behind nginx or Apache on the host instead, use `deploy/nginx-sawargi.conf` (it proxies to
`127.0.0.1:8088`). For Apache, run `sudo a2enmod proxy proxy_http headers` and add
`ProxyPreserveHost On`, `RequestHeader set X-Forwarded-Proto "https"` and
`ProxyPass /sawargi-coffee http://127.0.0.1:8088/sawargi-coffee` (plus the matching
`ProxyPassReverse`) to the `:443` VirtualHost.

Check it:

```bash
curl -I http://127.0.0.1:8088/sawargi-coffee/                 # 200, straight from the stack
curl -s https://website.taufikandrian.my.id/sawargi-coffee/shop/wp-json/wc/store/v1/products?category=batch | head -c 400
```

After you add a batch, the second command must show `"extensions":{"sawargi":{…}}`. If
`extensions` is empty, the plugin isn't loaded: check **Plugins → Must-Use** in WP admin.

`bootstrap-wordpress.sh` uses `WP_ADMIN_PASSWORD` from `.env` if you set one; otherwise it prints
a random one once. Either way, keep it in a password manager and remove it from `.env`.

## 3. Adding a batch (the weekly job)

**Fastest: one command on the VPS.** Copy the template, fill in the real values, run it:

```bash
cd /opt/sawargi-coffee
cp deploy/batches/TEMPLATE.env deploy/batches/SWG-CN-015.env
nano deploy/batches/SWG-CN-015.env
./deploy/add-batch.sh deploy/batches/SWG-CN-015.env
```

It creates everything below in one go: a variable product (SKU = code) in **Batch**, managed
stock, one variation per grind at your price, and the Sawargi batch fields. It refuses an
incomplete file and a code that already exists. Set `STATUS=draft` to check it in WP admin before
it goes live. After that, stock falls with paid orders; change it by hand in WP admin.

**By hand in WP admin** (same result):

1. **Products → Add New**. Name it e.g. `Ciwidey Natural · SWG-CN-015`.
2. **Product data: Variable product.**
3. **Inventory tab:** SKU = the batch code (`SWG-CN-015`). Tick **Manage stock**, set
   **Stock quantity** to the bags you have (e.g. 60). *Required:* the site hides a batch without
   managed stock rather than guess.
4. **Attributes tab:** add **Grind**, select the grinds you'll sell, tick *Used for variations*.
5. **Variations tab:** *Generate variations*. For each variation set the **price** (IDR) and leave
   stock management **off**, so all grinds share the batch's stock.
6. **Categories:** tick **Batch**.
7. **Sawargi batch box** (right side): roast date, harvest, cup score, tasting notes, bags roasted.
8. **Publish.** The site shows it on the next page load. Newest roast date is "current".

Sold out: stock reaches 0 automatically as paid orders come in, or set it by hand. The site shows
the batch as sold out and blocks it at checkout.

## 4. Payments

WooCommerce → Settings → Payments. Install a gateway plugin from Plugins → Add New (search
"Midtrans" or "Xendit"), connect your merchant account and follow its setup. You need an
approved merchant account with the gateway before real payments work. Test with the gateway's
sandbox first.

## 5. Updating the site (GitHub → VPS pipeline)

Every push to `main` (a merged PR) runs `.github/workflows/deploy.yml`:

1. **On GitHub's runners:** `npm ci`, type-check, tests, lint, and a build for `/sawargi-coffee`
   against the live store. A failing check stops the deploy, so the site never goes down over a
   bad build. Building there also keeps the load off the VPS, which is short on memory.
2. **Over SSH:** the built site is sent to the VPS, where `deploy/remote-deploy.sh`:
   - fast-forwards `/opt/sawargi-coffee` to that commit;
   - runs `docker compose up -d` if anything in `deploy/` changed, recreating Caddy when its
     Caddyfile changed and restarting WordPress when the plugin changed;
   - swaps the new site into `deploy/site`.

Pull requests get the same checks, without the deploy. Stock and batches never need a deploy;
the site reads them live.

### One-time setup

Follow **[REMOTE-DEPLOY.md](REMOTE-DEPLOY.md)**. In short:
1. Run `./deploy/setup-remote-deploy.sh` on the VPS.
2. Paste the values it prints into GitHub's Actions secrets.
3. Allow SSH in the cloud firewall.
4. Run the workflow once.

### By hand (fallback)

```bash
cd /opt/sawargi-coffee && git pull && ./deploy/build-site.sh
cd deploy && docker compose up -d --force-recreate caddy    # only if deploy/Caddyfile changed
```

`git pull` replaces the Caddyfile with a new file, and a single-file bind mount keeps showing the
container the old one. The pipeline handles this for you; by hand, you have to recreate Caddy.

## 6. Backups

See **[BACKUPS.md](BACKUPS.md)**. In short:
- `./deploy/install-backup-cron.sh` turns on a nightly backup of the database and uploads.
- `BACKUP_REMOTE` in `.env` adds an encrypted copy off the server (rclone).
- `./deploy/verify-backup.sh` restores the newest backup into a throwaway database, to prove it
  works.

## 7. Security checklist

- Strong unique passwords in `deploy/.env`; never commit it (it's git-ignored).
- The admin login is public at `/sawargi-coffee/wp-admin`. Don't use `admin` as the username (it's
  the first one bots try), use a long generated password, and add a login-limiting or 2FA plugin
  (e.g. Limit Login Attempts Reloaded, Two Factor).
- Keep WordPress, WooCommerce and plugins updated (WP admin → Updates), weekly.
- Only install plugins you need, from reputable authors.
- `DISALLOW_FILE_EDIT` is on (no code editing from WP admin); `xmlrpc.php` is blocked by Caddy.
- The stack listens on 127.0.0.1 only; the database has no port at all.

## How the pieces talk (for developers)

- **Catalogue:** `GET ${PUBLIC_URL}${BASE_PATH}/shop/wp-json/wc/store/v1/products?category=batch` →
  `src/data/catalog.ts` maps each product to a batch. Batch fields and the live stock count come
  from `extensions.sawargi`, added by `wordpress/mu-plugins/sawargi-headless.php`.
- **Hand-off:** `${PUBLIC_URL}${BASE_PATH}/shop/checkout/?add-to-cart=<variation id>&quantity=<n>`.
- **Base path:** `SITE_BASE_PATH=/sawargi-coffee` at build time sets Vite's `base`. Routes and
  `public/` files go through `src/lib/basePath.ts` (`withBase`, `stripBase`, `asset`), so code keeps
  writing `/checkout` and `/media/...`.
- **No store configured** (`VITE_WC_URL` unset): the site uses the sample data in
  `src/data/shop.ts` and the demo checkout. Local dev and tests work this way.
- **Store unreachable:** the site says stock is unavailable. It never shows sample stock.
- **Contract test:** `src/data/contract.test.ts` runs the plugin's PHP against stubbed WordPress and
  feeds the result through the site's mapper.

## Verified vs not yet verified

Verified in development: the site's mapping and hand-off (unit tests with Store API fixtures),
the plugin's PHP (syntax check and a stubbed run), `docker compose config`, and a production build
under `/sawargi-coffee` in a browser behind a server that mimics the Caddyfile's routes (assets, video
range requests, deep links, hand-off URL, the wp-admin redirect).

**Not yet verified against a live WordPress** (the build environment couldn't download
WordPress): the Store API extension registering on a real WooCommerce, the `add-to-cart` hand-off
on a real checkout, `bootstrap-wordpress.sh`, the Caddyfile itself, WordPress running from a
subfolder behind two proxies, and a payment plugin end to end. Do a
full test order in the gateway's sandbox before going live.
