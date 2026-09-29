#!/usr/bin/env bash
# First-time WordPress + WooCommerce setup for Sawargi. Safe to re-run: each step
# checks before it creates. Run on the VPS after `docker compose up -d`:
#   ./deploy/bootstrap-wordpress.sh
set -euo pipefail
cd "$(dirname "$0")"

# shellcheck disable=SC1091
set -a; source .env; set +a
wp() { docker compose run --rm -T wpcli wp "$@"; }
shop_url="${PUBLIC_URL}${BASE_PATH}/shop"

case "${DB_PASSWORD}${DB_ROOT_PASSWORD}" in
  *change-me*) echo "Set real DB_PASSWORD and DB_ROOT_PASSWORD in deploy/.env first (see docs/cms/WORDPRESS.md)."; exit 1 ;;
esac

if ! wp core is-installed >/dev/null 2>&1; then
  password="${WP_ADMIN_PASSWORD:-$(openssl rand -base64 18)}"
  wp core install --url="${shop_url}" --title="Sawargi Shop" \
    --admin_user="${WP_ADMIN_USER}" --admin_email="${WP_ADMIN_EMAIL}" --admin_password="${password}" --skip-email
  if [ -n "${WP_ADMIN_PASSWORD:-}" ]; then
    echo "Admin user ${WP_ADMIN_USER} created with the password from deploy/.env. Delete WP_ADMIN_PASSWORD from it now."
  else
    echo "Admin user ${WP_ADMIN_USER} created. Password (save it now, it isn't stored): ${password}"
  fi
fi

# The Docker image only copies WordPress in on first start and never upgrades it, and
# WooCommerce requires a recent WordPress. Bring core up to date before installing it.
wp core update
wp core update-db

wp rewrite structure '/%postname%/'   # Caddy handles pretty URLs; there's no .htaccess to write
wp plugin is-installed woocommerce || wp plugin install woocommerce
wp plugin activate woocommerce

# Store basics: Indonesian Rupiah, no decimals, West Java.
wp option update woocommerce_currency IDR
wp option update woocommerce_price_num_decimals 0
wp option update woocommerce_price_thousand_sep .
wp option update woocommerce_price_decimal_sep ,
wp option update woocommerce_default_country 'ID:JB'
wp option update woocommerce_manage_stock yes

# The "batch" category the site reads, and the Grind attribute (the variations).
if ! wp wc product_cat list --slug=batch --user="${WP_ADMIN_USER}" --format=ids | grep -q '[0-9]'; then
  wp wc product_cat create --name=Batch --slug=batch --user="${WP_ADMIN_USER}"
fi
grind_id="$(wp wc product_attribute list --user="${WP_ADMIN_USER}" --field=id --slug=pa_grind 2>/dev/null || true)"
if [ -z "${grind_id}" ]; then
  grind_id="$(wp wc product_attribute create --name=Grind --slug=grind --user="${WP_ADMIN_USER}" --porcelain)"
fi
for term in "Whole bean" "Coarse" "Medium" "Fine"; do
  if ! wp wc product_attribute_term list "${grind_id}" --user="${WP_ADMIN_USER}" --field=name | grep -qx "${term}"; then
    wp wc product_attribute_term create "${grind_id}" --name="${term}" --user="${WP_ADMIN_USER}"
  fi
done

echo
echo "Done. Next, in ${PUBLIC_URL}${BASE_PATH}/wp-admin :"
echo "  1. Install a payment plugin (WooCommerce → Settings → Payments), e.g. Midtrans or Xendit."
echo "  2. Add each batch as a product (docs/cms/WORDPRESS.md, 'Adding a batch')."
echo "  3. Set up shipping zones (WooCommerce → Settings → Shipping)."
