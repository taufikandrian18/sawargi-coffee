#!/usr/bin/env bash
# VPS side of the GitHub → VPS pipeline (.github/workflows/deploy.yml).
#
# It runs as the forced command of a dedicated deploy key, so that key can do this and
# nothing else (no shell, no port forwarding). In ~/.ssh/authorized_keys:
#   command="/opt/sawargi-coffee/deploy/remote-deploy.sh",restrict ssh-ed25519 AAAA… sawargi-github-deploy
#
# Input: the commit SHA as the SSH command, and the built site (dist/) as a .tar.gz on stdin.
# It fast-forwards the checkout to that commit, applies deploy/ changes to the Docker stack,
# and publishes the site.
set -euo pipefail
cd "$(dirname "$(realpath "$0")")/.."

sha="${SSH_ORIGINAL_COMMAND:-${1:-}}"
if ! [[ "${sha}" =~ ^[0-9a-f]{40}$ ]]; then
  echo "remote-deploy: expected a 40-character commit SHA, got '${sha:0:60}'" >&2
  exit 2
fi

command -v rsync >/dev/null || { echo "remote-deploy: rsync is required: sudo apt install rsync" >&2; exit 4; }

# One deploy at a time.
exec 9>/tmp/sawargi-deploy.lock
flock 9

# Read the upload first, before anything else can touch stdin.
upload="$(mktemp -d)"
trap 'rm -rf "${upload}"' EXIT
tar -xzf - -C "${upload}"
[ -f "${upload}/index.html" ] || { echo "remote-deploy: the upload has no index.html" >&2; exit 3; }

before="$(git rev-parse HEAD)"
git fetch --quiet origin main
if git merge-base --is-ancestor "${sha}" "${before}" && [ "${sha}" != "${before}" ]; then
  echo "remote-deploy: ${sha:0:7} is older than what's live (${before:0:7}); skipping."
  exit 0
fi
git merge --ff-only --quiet "${sha}"
echo "remote-deploy: code ${before:0:7} → ${sha:0:7}"

# Apply stack changes. Caddy is recreated when its Caddyfile changes: the file is
# bind-mounted, and git replaces it with a new file the running container can't see.
changed="$(git diff --name-only "${before}" HEAD -- deploy/ wordpress/)"
if [ -n "${changed}" ]; then
  (
    cd deploy
    docker compose up -d
    if grep -qx 'deploy/Caddyfile' <<<"${changed}"; then docker compose up -d --force-recreate caddy; fi
    if grep -qx 'wordpress/mu-plugins/sawargi-headless.php' <<<"${changed}"; then docker compose restart wordpress; fi
  )
fi

rsync -a --delete --delay-updates --exclude README.md "${upload}/" deploy/site/
echo "remote-deploy: site ${sha:0:7} is live."
