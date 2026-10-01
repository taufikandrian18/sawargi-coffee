#!/usr/bin/env bash
# One-time setup of the encrypted, off-server copy of the backups (Google Drive via rclone).
# Run on the VPS as ubuntu, from anywhere:
#   ./deploy/setup-backup-remote.sh
# It installs rclone if needed, connects Google Drive (you sign in once from your Mac), creates an
# encrypted remote with generated passwords, sets BACKUP_REMOTE in deploy/.env and runs a backup.
# Safe to re-run: existing remotes are kept. Background: docs/cms/BACKUPS.md
set -euo pipefail
cd "$(dirname "$(realpath "$0")")"

GDRIVE="${GDRIVE_REMOTE:-gdrive}"
CRYPT="${CRYPT_REMOTE:-sawargi-crypt}"
FOLDER="${BACKUP_FOLDER:-sawargi-backups}"

say() { printf '\n\033[1m%s\033[0m\n' "$*"; }
fail() { printf '\033[31msetup: %s\033[0m\n' "$*" >&2; exit 1; }

[ "$(id -u)" != 0 ] || fail "run this as ubuntu, not root: the nightly backup runs as ubuntu and reads ubuntu's rclone config"
[ -f .env ] || fail "deploy/.env is missing"

say "1. rclone"
if ! command -v rclone > /dev/null; then
  sudo apt-get update -qq && sudo apt-get install -y -qq rclone
fi
rclone version | head -n 1

say "2. Google Drive (remote '${GDRIVE}')"
if rclone listremotes | grep -qx "${GDRIVE}:"; then
  echo "already connected"
else
  cat <<MSG
Sign in to Google once, from your Mac (this server has no browser):
  a) In the Mac's Terminal:   brew install rclone
  b) Then run:                rclone authorize "drive"
  c) A browser opens: sign in with the Google account that should hold the backups, allow access.
  d) The Mac's Terminal prints a token: a line of JSON starting with {"access_token":
     Copy that whole line and paste it below.
MSG
  read -r -p "token> " token
  case "${token}" in
    \{*access_token*\}) ;;
    *) fail "that doesn't look like the token line (it starts with {\"access_token\")" ;;
  esac
  rclone config create "${GDRIVE}" drive scope=drive token="${token}" > /dev/null
  echo "connected"
fi
rclone lsd "${GDRIVE}:" > /dev/null || fail "Google Drive doesn't answer; re-run after: rclone config delete ${GDRIVE}"

say "3. Encryption (remote '${CRYPT}' → ${GDRIVE}:${FOLDER})"
if rclone listremotes | grep -qx "${CRYPT}:"; then
  echo "already set up (its passwords were shown when it was created)"
else
  gen() { openssl rand -base64 48 | tr -dc 'A-Za-z0-9' | head -c 32; }
  pass="$(gen)"
  salt="$(gen)"
  rclone config create "${CRYPT}" crypt remote="${GDRIVE}:${FOLDER}" \
    filename_encryption=standard directory_name_encryption=true \
    password="${pass}" password2="${salt}" --obscure > /dev/null
  cat <<MSG

  ┌─────────────────────────────────────────────────────────────────────┐
  │ SAVE THESE TWO NOW in your password manager ("Sawargi backup keys"). │
  │ Without them nobody can read the backups, including you.            │
  └─────────────────────────────────────────────────────────────────────┘
    password:  ${pass}
    password2: ${salt}
    remote:    ${CRYPT} = crypt over ${GDRIVE}:${FOLDER}, standard filename encryption

MSG
  read -r -p "Type 'saved' once they are in your password manager: " answer
  [ "${answer}" = saved ] || fail "stopped before using it. Save the two passwords above, then re-run this script."
  clear 2> /dev/null || true
fi

say "4. deploy/.env"
if grep -q '^BACKUP_REMOTE=' .env; then
  sed -i "s|^BACKUP_REMOTE=.*|BACKUP_REMOTE=${CRYPT}:|" .env
else
  printf '\nBACKUP_REMOTE=%s:\n' "${CRYPT}" >> .env
fi
grep '^BACKUP_REMOTE=' .env

say "5. A backup, copied off the server"
./backup.sh
echo
echo "Off-server copy (decrypted names):"
rclone ls "${CRYPT}:" | tail -n 4
echo
echo "Done. The nightly backup now copies here too. Restore drill: ./deploy/verify-backup.sh"
