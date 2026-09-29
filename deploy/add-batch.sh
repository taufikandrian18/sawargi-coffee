#!/usr/bin/env bash
# Add a new batch to the store from a batch file. Run on the VPS from the repo root:
#   cp deploy/batches/TEMPLATE.env deploy/batches/SWG-CN-015.env   # fill in the real values
#   ./deploy/add-batch.sh deploy/batches/SWG-CN-015.env
# It refuses incomplete files and existing batch codes. Stock changes after that happen in WP admin.
set -euo pipefail
batch_file="$(realpath "${1:?usage: ./deploy/add-batch.sh deploy/batches/<CODE>.env}")"
cd "$(dirname "$0")"

# shellcheck disable=SC1091
set -a; source .env; set +a
# The batch file's own variables (CODE, ROAST_DATE, …), read in a subshell so they can't clash.
batch_env() { ( set -a; CODE='' ROAST_DATE='' HARVEST='' CUP_SCORE='' NOTES='' BAGS='' PRICE_IDR='' GRINDS='' STATUS=''
  # shellcheck disable=SC1090
  source "$batch_file"; printf '%s' "${!1}" ); }

echo "==> Adding batch $(batch_env CODE) from ${batch_file}"
timeout 600 docker compose run --rm -T \
  -e SAWARGI_CODE="$(batch_env CODE)" \
  -e SAWARGI_ROAST_DATE="$(batch_env ROAST_DATE)" \
  -e SAWARGI_HARVEST="$(batch_env HARVEST)" \
  -e SAWARGI_CUP_SCORE="$(batch_env CUP_SCORE)" \
  -e SAWARGI_NOTES="$(batch_env NOTES)" \
  -e SAWARGI_BAGS="$(batch_env BAGS)" \
  -e SAWARGI_PRICE_IDR="$(batch_env PRICE_IDR)" \
  -e SAWARGI_GRINDS="$(batch_env GRINDS)" \
  -e SAWARGI_STATUS="$(batch_env STATUS)" \
  wpcli wp eval-file /deploy/add-batch.php --user="${WP_ADMIN_USER}"
echo "The site shows it on the next page load: ${PUBLIC_URL}${BASE_PATH}/"
