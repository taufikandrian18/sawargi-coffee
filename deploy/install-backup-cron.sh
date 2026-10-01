#!/usr/bin/env bash
# Run deploy/backup.sh every night at 03:17 (server time) from the current user's crontab.
# Safe to re-run: it replaces its own line and leaves every other cron job alone.
#   ./deploy/install-backup-cron.sh            install / update
#   ./deploy/install-backup-cron.sh --remove   remove
set -euo pipefail
repo="$(cd "$(dirname "$(realpath "$0")")/.." && pwd)"
marker="# sawargi-backup"
line="17 3 * * * ${repo}/deploy/backup.sh >> ${repo}/deploy/backups/backup.log 2>&1 ${marker}"

current="$(crontab -l 2>/dev/null | grep -vF "${marker}" || true)"
if [ "${1:-}" = "--remove" ]; then
  printf '%s\n' "${current}" | sed '/^$/d' | crontab -
  echo "Removed the nightly backup."
  exit 0
fi
mkdir -p "${repo}/deploy/backups"
{ printf '%s\n' "${current}" | sed '/^$/d'; printf '%s\n' "${line}"; } | crontab -
echo "Nightly backup installed (03:17, $(date +%Z)). Log: deploy/backups/backup.log"
crontab -l | grep -F "${marker}"
