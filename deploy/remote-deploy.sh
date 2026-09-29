#!/usr/bin/env bash
# VPS side of the GitHub → VPS pipeline (.github/workflows/deploy.yml).
#
# It runs as the forced command of a dedicated deploy key, so that key can do this and
# nothing else (no shell, no port forwarding). In ~/.ssh/authorized_keys:
#   command="/opt/sawargi-coffee/deploy/remote-deploy.sh",restrict ssh-ed25519 AAAA… sawargi-github-deploy
#
# Input: the commit SHA as the SSH command, and the built site (dist/) as a .tar.gz on stdin.
# `check` as the command instead runs the preflight only and deploys nothing
# (deploy/setup-remote-deploy.sh uses it to test the key end to end).
# It fast-forwards the checkout to that commit, applies deploy/ changes to the Docker stack,
# and publishes the site.
set -euo pipefail
cd "$(dirname "$(realpath "$0")")/.."

sha="${SSH_ORIGINAL_COMMAND:-${1:-}}"

preflight() {
  local tool
  for tool in git docker rsync flock tar; do
    command -v "${tool}" >/dev/null || { echo "remote-deploy: ${tool} is not installed" >&2; exit 4; }
  done
  git fetch --quiet origin main || { echo "remote-deploy: can't fetch from GitHub (git fetch origin main)" >&2; exit 5; }
  docker compose -f deploy/docker-compose.yml ps --quiet >/dev/null \
    || { echo "remote-deploy: can't run docker compose as $(id -un) (docker group? deploy/.env?)" >&2; exit 6; }
  [ -w deploy/site ] || { echo "remote-deploy: deploy/site isn't writable by $(id -un)" >&2; exit 7; }
  if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
    echo "remote-deploy: tracked files were edited on the VPS; a fast-forward would fail:" >&2
    git status --short --untracked-files=no >&2
    exit 8
  fi
}

if [ "${sha}" = "check" ]; then
  preflight
  echo "remote-deploy: ready. Code at $(git rev-parse --short HEAD), running as $(id -un) in $(pwd)."
  exit 0
fi
if ! [[ "${sha}" =~ ^[0-9a-f]{40}$ ]]; then
  echo "remote-deploy: expected a 40-character commit SHA (or 'check'), got '${sha:0:60}'" >&2
  exit 2
fi

# One deploy at a time.
exec 9>"$(git rev-parse --git-dir)/sawargi-deploy.lock"   # owned by the repo owner, unlike a shared /tmp file
flock 9

# Read the upload first, before anything else can touch stdin.
upload="$(mktemp -d)"
trap 'rm -rf "${upload}"' EXIT
tar -xzf - -C "${upload}"
[ -f "${upload}/index.html" ] || { echo "remote-deploy: the upload has no index.html" >&2; exit 3; }

preflight
before="$(git rev-parse HEAD)"
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
