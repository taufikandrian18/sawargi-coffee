#!/usr/bin/env bash
# Build the designed site against the live store and publish it into the Caddy stack.
# Run on the VPS from the repo root:  ./deploy/build-site.sh
set -euo pipefail
cd "$(dirname "$0")/.."

# shellcheck disable=SC1091
set -a; source deploy/.env; set +a
store_url="${PUBLIC_URL}${BASE_PATH}/shop"

echo "Building for ${PUBLIC_URL}${BASE_PATH}/ against the store at ${store_url} …"
# Build in a throwaway Node container, so the VPS doesn't need Node installed.
docker run --rm \
  --user "$(id -u):$(id -g)" -e HOME=/tmp \
  -e VITE_WC_URL="${store_url}" -e SITE_BASE_PATH="${BASE_PATH}" \
  -v "$PWD":/app -w /app node:22 \
  sh -c 'npm ci && npx tsc -b && npm test && npm run build'

# Publish into the folder Caddy has mounted. (Don't rename or replace the folder:
# Docker bind mounts track the original directory, so Caddy would keep serving the old copy.)
# --delay-updates moves new files into place at the end, so the switch is near-instant.
command -v rsync >/dev/null || { echo "rsync is required: sudo apt install rsync"; exit 1; }
rsync -a --delete --delay-updates --exclude README.md dist/ deploy/site/
echo "Published to deploy/site: ${PUBLIC_URL}${BASE_PATH}/ serves it immediately; no restart needed."
