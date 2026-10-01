#!/usr/bin/env bash
# Back up everything the shop can't recreate: the database (orders, customers, products, stock)
# and wp-content/uploads (product photos). Run on the VPS from anywhere:
#   ./deploy/backup.sh
# Nightly:           ./deploy/install-backup-cron.sh
# Restore drill:     ./deploy/verify-backup.sh
# Off-server copy:   set BACKUP_REMOTE in deploy/.env (an encrypted rclone remote; docs/cms/BACKUPS.md)
set -euo pipefail
cd "$(dirname "$(realpath "$0")")"

fail() { echo "backup: $*" >&2; exit 1; }

# shellcheck disable=SC1091
set -a; source .env; set +a
mkdir -p backups
exec 9>backups/.lock
flock -n 9 || fail "another backup is still running"

stamp="$(date +%Y%m%d-%H%M)"
db="backups/db-${stamp}.sql.gz"
uploads="backups/uploads-${stamp}.tar.gz"
# Write to .part files and rename only once they check out, so a failed run never looks like a backup.
trap 'rm -f "${db}.part" "${uploads}.part"' EXIT

# Database. The password goes in through the environment, not the command line (visible in `ps`).
docker compose exec -T -e MYSQL_PWD="${DB_ROOT_PASSWORD}" db \
  mariadb-dump --single-transaction --routines --triggers -u root "${DB_NAME:-sawargi}" \
  | gzip > "${db}.part"
gzip -t "${db}.part" || fail "the database dump is not a valid gzip"
zcat "${db}.part" | tail -n 1 | grep -q 'Dump completed' || fail "the database dump is incomplete"
mv "${db}.part" "${db}"

# Uploads (product photos).
docker compose run --rm -T --entrypoint tar wpcli czf - wp-content/uploads > "${uploads}.part"
tar -tzf "${uploads}.part" > /dev/null || fail "the uploads archive is unreadable"
mv "${uploads}.part" "${uploads}"

echo "backup: ${stamp} saved ($(du -h "${db}" | cut -f1) database, $(du -h "${uploads}" | cut -f1) uploads)"

# Keep two weeks on this server.
find backups -maxdepth 1 -name '*.gz' -mtime +"${BACKUP_KEEP_DAYS:-14}" -delete

# Off-server copy: a backup on the same disk as the shop isn't a backup.
if [ -n "${BACKUP_REMOTE:-}" ]; then
  command -v rclone > /dev/null || fail "BACKUP_REMOTE is set but rclone is not installed (sudo apt install rclone)"
  rclone copy backups "${BACKUP_REMOTE}" --include '*.gz'
  rclone delete "${BACKUP_REMOTE}" --include '*.gz' --min-age "${BACKUP_REMOTE_KEEP_DAYS:-60}d"
  echo "backup: copied off-server to ${BACKUP_REMOTE}"
else
  echo "backup: WARNING: BACKUP_REMOTE is not set, so these backups exist only on this server." >&2
fi
