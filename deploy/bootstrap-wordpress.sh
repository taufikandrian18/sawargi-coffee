#!/usr/bin/env bash
# First-time WordPress + WooCommerce setup for Sawargi. Safe to re-run: each step
# checks before it creates. Run on the VPS after `docker compose up -d`:
#   ./deploy/bootstrap-wordpress.sh
set -euo pipefail
cd "$(dirname "$0")"

# shellcheck disable=SC1091
set -a; source .env; set +a
wp() { docker compose run --rm -T wpcli wp "$@"; }

if ! wp core is-installed >/dev/null 2>&1; then
  password="$(openssl rand -base64 18)"
  wp core install --url="https://${SHOP_DOMAIN}" --title="Sawargi Shop" \
    --admin_user="${WP_ADMIN_USER}" --admin_email="${WP_ADMIN_EMAIL}" --admin_password="${password}" --skip-email
  echo "Admin user ${WP_ADMIN_USER} created. Password (save it now, it isn't stored): ${password}"
fi

wp rewrite structure '/%postname%/' --hard
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
echo "Done. Next, in https://${SHOP_DOMAIN}/wp-admin :"
echo "  1. Install a payment plugin (WooCommerce → Settings → Payments), e.g. Midtrans or Xendit."
echo "  2. Add each batch as a product (docs/cms/WORDPRESS.md, 'Adding a batch')."
echo "  3. Set up shipping zones (WooCommerce → Settings → Shipping)."
