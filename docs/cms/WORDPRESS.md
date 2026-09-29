# Sawargi on WordPress + WooCommerce (headless), on your own VPS

This site stays the storefront. WordPress + WooCommerce become the back office: batches, stock,
prices, orders and payments are all managed in WP admin, never in code.

```
Visitor ──► https://SITE_DOMAIN  (this React site, static files served by Caddy)
              │  reads batches + live stock from the public Store API (no keys in the browser)
              ▼
            https://SHOP_DOMAIN  (WordPress + WooCommerce on PHP-FPM, MariaDB)
              ▲  "Continue to payment" hands the chosen batch/grind/quantity to WooCommerce's
              │  own checkout, where delivery details and payment plugins run
```

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
every plugin, every payment method and every plugin update just works. The cost: the checkout
page uses your WordPress theme, not this site's design. Pick a clean theme (Storefront or a block
theme) and set its colours to the brand tokens (`#0c0a08` ink, `#ece6da` paper, `#b33f2d` cherry).

## 1. The VPS

- Ubuntu 22.04/24.04, **2 GB RAM minimum** (WooCommerce + MariaDB are heavy on 1 GB), 20 GB disk.
- DNS: A (and AAAA) records for both `SITE_DOMAIN` and `SHOP_DOMAIN` (and `www.SITE_DOMAIN`)
  pointing at the VPS, **before** first start, so Caddy can get certificates.
- Firewall: allow 22, 80 and 443 only.
  ```bash
  sudo ufw allow OpenSSH && sudo ufw allow 80 && sudo ufw allow 443 && sudo ufw enable
  ```
- Install Docker (with the compose plugin), Node 22, git and rsync.

## 2. First deploy

```bash
sudo mkdir -p /opt/sawargi && sudo chown "$USER" /opt/sawargi
git clone https://github.com/taufikandrian18/sawargi-coffee.git /opt/sawargi
cd /opt/sawargi
cp deploy/.env.example deploy/.env      # then edit: domains, email, long random passwords
cd deploy && docker compose up -d && cd ..
./deploy/bootstrap-wordpress.sh         # installs WordPress + WooCommerce, IDR, batch category, Grind attribute
./deploy/build-site.sh                  # builds this site against the store and publishes it
```

`bootstrap-wordpress.sh` prints the admin password once. Save it in a password manager.

## 3. Adding a batch (the weekly job)

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

## 5. Updating the site

After pulling new code, or after changing `SITE_DOMAIN`/`SHOP_DOMAIN`:

```bash
cd /opt/sawargi && git pull && ./deploy/build-site.sh
```

Stock and batches **don't** need a rebuild; the site reads them live.

## 6. Backups

```bash
./deploy/backup.sh     # database + uploads into deploy/backups, keeps 14 days
```

Add it to cron (see the top of the script) **and copy the backups off the VPS**
(e.g. rclone to cloud storage). A backup on the same disk isn't a backup.

## 7. Security checklist

- Strong unique passwords in `deploy/.env`; never commit it (it's git-ignored).
- Keep WordPress, WooCommerce and plugins updated (WP admin → Updates), weekly.
- Only install plugins you need, from reputable authors.
- `DISALLOW_FILE_EDIT` is on (no code editing from WP admin); `xmlrpc.php` is blocked by Caddy.
- The REST API only answers browser requests from `SITE_DOMAIN` (`SAWARGI_FRONTEND_ORIGIN`).

## How the pieces talk (for developers)

- **Catalogue:** `GET https://SHOP_DOMAIN/wp-json/wc/store/v1/products?category=batch` →
  `src/data/catalog.ts` maps each product to a batch. Batch fields and the live stock count come
  from `extensions.sawargi`, added by `wordpress/mu-plugins/sawargi-headless.php`.
- **Hand-off:** `https://SHOP_DOMAIN/checkout/?add-to-cart=<variation id>&quantity=<n>`.
- **No store configured** (`VITE_WC_URL` unset): the site uses the sample data in
  `src/data/shop.ts` and the demo checkout. Local dev and tests work this way.
- **Store unreachable:** the site says stock is unavailable. It never shows sample stock.
- **Contract test:** `src/data/contract.test.ts` runs the plugin's PHP against stubbed WordPress and
  feeds the result through the site's mapper.

## Verified vs not yet verified

Verified in development: the site's mapping and hand-off (unit tests with Store API fixtures),
the plugin's PHP (syntax check and a stubbed run), `docker compose config`.

**Not yet verified against a live WordPress** (the build environment couldn't download
WordPress): the Store API extension registering on a real WooCommerce, the `add-to-cart` hand-off
on a real checkout, `bootstrap-wordpress.sh`, the Caddyfile, and a payment plugin end to end. Do a
full test order in the gateway's sandbox before going live.
