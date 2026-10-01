#!/usr/bin/env bash
# Restore drill: load a database backup into a throwaway MariaDB container and compare it with
# the live shop. Nothing live is touched. Run on the VPS:
#   ./deploy/verify-backup.sh                                   newest backup
#   ./deploy/verify-backup.sh deploy/backups/db-20261001-0317.sql.gz
set -euo pipefail
cd "$(dirname "$(realpath "$0")")"

fail() { echo "verify: $*" >&2; exit 1; }

# shellcheck disable=SC1091
set -a; source .env; set +a
file="${1:-$(ls -1t backups/db-*.sql.gz 2>/dev/null | head -n 1)}"
[ -n "${file}" ] && [ -f "${file}" ] || fail "no database backup found (run ./deploy/backup.sh first)"
gzip -t "${file}" || fail "${file} is not a valid gzip"

name="sawargi-restore-test-$$"
pw="verify-$$"
trap 'docker rm -f "${name}" > /dev/null 2>&1 || true' EXIT
echo "verify: loading ${file} into a temporary database…"
docker run -d --rm --name "${name}" -e MARIADB_ROOT_PASSWORD="${pw}" -e MARIADB_DATABASE=restore_test \
  mariadb:11 --innodb-buffer-pool-size=32M > /dev/null
for _ in $(seq 1 60); do
  docker exec -e MYSQL_PWD="${pw}" "${name}" mariadb -u root -e 'SELECT 1' > /dev/null 2>&1 && break
  sleep 2
done
zcat "${file}" | docker exec -i -e MYSQL_PWD="${pw}" "${name}" mariadb -u root restore_test \
  || fail "the backup did not load"

# The same questions, asked of the backup and of the live database.
prefix="${WORDPRESS_TABLE_PREFIX:-wp_}"
in_backup() { docker exec -i -e MYSQL_PWD="${pw}" "${name}" mariadb -u root -N restore_test; }
in_live() { docker compose exec -T -e MYSQL_PWD="${DB_ROOT_PASSWORD}" db mariadb -u root -N "${DB_NAME:-sawargi}"; }
counts() {
  local run="$1" orders
  # WooCommerce keeps orders in wc_orders (HPOS, the default since 8.2); older stores keep them
  # as shop_order posts. A query naming a missing table fails, so check which one exists first.
  if [ "$(echo "SHOW TABLES LIKE '${prefix}wc_orders';" | "${run}")" = "${prefix}wc_orders" ]; then
    orders="SELECT CONCAT('orders: ', COUNT(*)) FROM ${prefix}wc_orders WHERE type = 'shop_order';"
  else
    orders="SELECT CONCAT('orders: ', COUNT(*)) FROM ${prefix}posts WHERE post_type = 'shop_order';"
  fi
  "${run}" <<SQL
SELECT CONCAT('products: ', COUNT(*)) FROM ${prefix}posts WHERE post_type = 'product';
SELECT CONCAT('variations (grinds): ', COUNT(*)) FROM ${prefix}posts WHERE post_type = 'product_variation';
${orders}
SQL
}
backup_counts="$(counts in_backup)" || fail "the restored database can't be queried (tables missing?)"
live_counts="$(counts in_live)" || live_counts="(live database unavailable)"

echo
echo "  backup ${file##*/}"; printf '%s\n' "${backup_counts}" | sed 's/^/    /'
echo "  live shop now";       printf '%s\n' "${live_counts}"   | sed 's/^/    /'
echo
echo "verify: OK, the backup restores. Counts can differ from live by whatever changed since it was taken."
