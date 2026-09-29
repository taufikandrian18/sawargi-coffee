#!/usr/bin/env bash
# Nightly backup of orders, products and uploads. Cron example (03:15 daily):
#   15 3 * * * /opt/sawargi/deploy/backup.sh >> /var/log/sawargi-backup.log 2>&1
set -euo pipefail
cd "$(dirname "$0")"

# shellcheck disable=SC1091
set -a; source .env; set +a
stamp="$(date +%Y%m%d-%H%M)"
mkdir -p backups

docker compose exec -T db mariadb-dump --single-transaction -u root -p"${DB_ROOT_PASSWORD}" "${DB_NAME:-sawargi}" \
  | gzip > "backups/db-${stamp}.sql.gz"
docker compose run --rm -T --entrypoint tar wpcli czf - -C /var/www/html wp-content/uploads \
  > "backups/uploads-${stamp}.tar.gz"

# Keep two weeks locally. Copy backups off the VPS too: a backup on the same disk isn't one.
find backups -type f -mtime +14 -delete
echo "Backup ${stamp} done."
