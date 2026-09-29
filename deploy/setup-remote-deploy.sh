#!/usr/bin/env bash
# One-time setup of the VPS side of the GitHub → VPS deploy. Run on the VPS, as the user that
# owns /opt/sawargi-coffee (ubuntu), from the repo root:
#   ./deploy/setup-remote-deploy.sh            # checks, creates the deploy key, tests it, prints the secrets
#   ./deploy/setup-remote-deploy.sh --cleanup  # after the secrets are saved in GitHub: delete the private key
# Safe to re-run. Full walkthrough: docs/cms/REMOTE-DEPLOY.md
set -euo pipefail
cd "$(dirname "$(realpath "$0")")/.."
repo="$(pwd)"
key="${HOME}/.ssh/sawargi-deploy-key"
ssh_port="${SSH_PORT:-22}"

ok()   { printf '  \033[32m✔\033[0m %s\n' "$*"; }
fail() { printf '  \033[31m✘ %s\033[0m\n' "$*" >&2; exit 1; }
step() { printf '\n\033[1m%s\033[0m\n' "$*"; }

if [ "${1:-}" = "--cleanup" ]; then
  rm -f "${key}"
  echo "Deleted ${key}. GitHub's secret is now the only copy; the public half stays in authorized_keys."
  exit 0
fi

step "1. Checking the VPS"
[ "$(id -u)" != 0 ] || fail "Run this as ubuntu, not root/sudo: deploys run as the key's owner."
for tool in git docker rsync flock tar ssh ssh-keygen curl; do
  command -v "${tool}" >/dev/null || fail "${tool} is missing: sudo apt install ${tool/ssh-keygen/openssh-client}"
done
ok "tools: git docker rsync flock tar ssh curl"
[ -f deploy/.env ] || fail "deploy/.env is missing (see docs/cms/WORDPRESS.md §2)."
ok "deploy/.env exists"
docker ps >/dev/null 2>&1 || fail "$(id -un) can't run docker without sudo: sudo usermod -aG docker $(id -un), then log out and in."
ok "docker works as $(id -un)"
[ -w deploy/site ] && [ -w .git ] || fail "The repo isn't owned by $(id -un): sudo chown -R $(id -un): ${repo}"
ok "repo is writable by $(id -un)"
git fetch --quiet origin main || fail "git fetch origin main failed: the VPS must be able to pull from GitHub."
ok "can fetch from GitHub"
[ "$(git rev-parse --abbrev-ref HEAD)" = main ] || fail "The checkout is on $(git rev-parse --abbrev-ref HEAD), not main: git checkout main"
git merge --ff-only --quiet origin/main 2>/dev/null || fail "main can't fast-forward to origin/main (local commits or edits?): git status"
ok "checkout is on main at $(git rev-parse --short HEAD)"
[ -x deploy/remote-deploy.sh ] || fail "deploy/remote-deploy.sh is missing or not executable: git pull"
ok "deploy/remote-deploy.sh is in place"

step "2. The deploy key"
install -m 700 -d "${HOME}/.ssh"
if [ -f "${key}.pub" ]; then
  ok "reusing ${key}.pub"
else
  ssh-keygen -q -t ed25519 -N '' -C "sawargi-github-deploy" -f "${key}"
  ok "created ${key} (+ .pub)"
fi
auth="${HOME}/.ssh/authorized_keys"
touch "${auth}" && chmod 600 "${auth}"
pub="$(cut -d' ' -f1,2 "${key}.pub")"
line="command=\"${repo}/deploy/remote-deploy.sh\",restrict ${pub} sawargi-github-deploy"
if grep -qF "${pub}" "${auth}"; then
  # Keep exactly one line for this key, with the current forced command.
  grep -vF "${pub}" "${auth}" > "${auth}.tmp" || true
  printf '%s\n' "${line}" >> "${auth}.tmp"
  cat "${auth}.tmp" > "${auth}" && rm -f "${auth}.tmp"
  ok "authorized_keys entry refreshed"
else
  printf '%s\n' "${line}" >> "${auth}"
  ok "authorized_keys entry added (forced command + restrict: this key can only deploy)"
fi

step "3. Testing the key through SSH (runs: remote-deploy.sh check)"
if [ ! -f "${key}" ]; then
  echo "  (private key already deleted with --cleanup; skipping the live test)"
else
  out="$(ssh -i "${key}" -p "${ssh_port}" -o IdentitiesOnly=yes -o BatchMode=yes \
    -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o LogLevel=ERROR \
    "$(id -un)@127.0.0.1" check 2>&1)" || fail "SSH test failed: ${out}"
  grep -q 'remote-deploy: ready' <<<"${out}" || fail "Unexpected answer: ${out}"
  ok "${out}"
  # And prove the key can't open a shell.
  if ssh -i "${key}" -p "${ssh_port}" -o IdentitiesOnly=yes -o BatchMode=yes -o StrictHostKeyChecking=no \
       -o UserKnownHostsFile=/dev/null -o LogLevel=ERROR "$(id -un)@127.0.0.1" 'id' 2>/dev/null | grep -q 'uid='; then
    fail "The key ran a shell command. The authorized_keys line isn't being applied."
  fi
  ok "the key can't run anything else (tried 'id': refused)"
fi

step "4. Values for GitHub → repo → Settings → Secrets and variables → Actions"
public_ip="${VPS_PUBLIC_IP:-$(curl -fsS --max-time 10 https://api.ipify.org || true)}"
[ -n "${public_ip}" ] || fail "Couldn't detect the public IP; re-run with VPS_PUBLIC_IP=<ip> ./deploy/setup-remote-deploy.sh"
host_keys="$(for f in /etc/ssh/ssh_host_ed25519_key.pub /etc/ssh/ssh_host_ecdsa_key.pub /etc/ssh/ssh_host_rsa_key.pub; do
  if [ -r "$f" ]; then
    awk -v h="${public_ip}" -v p="${ssh_port}" '{ if (p == 22) print h, $1, $2; else print "[" h "]:" p, $1, $2 }' "$f"
  fi
done)"
[ -n "${host_keys}" ] || fail "Couldn't read /etc/ssh/ssh_host_*_key.pub"

echo
echo "  VPS_HOST         ${public_ip}"
echo "  VPS_USER         $(id -un)"
[ "${ssh_port}" = 22 ] || echo "  VPS_PORT         ${ssh_port}"
echo "  VPS_KNOWN_HOSTS  (all lines between the markers)"
echo "----- BEGIN VPS_KNOWN_HOSTS -----"
echo "${host_keys}"
echo "----- END VPS_KNOWN_HOSTS -----"
if [ -f "${key}" ]; then
  echo "  VPS_SSH_KEY      (everything between the markers, including the BEGIN/END OPENSSH lines)"
  echo "----- BEGIN VPS_SSH_KEY -----"
  cat "${key}"
  echo "----- END VPS_SSH_KEY -----"
fi

if command -v gh >/dev/null && gh auth status >/dev/null 2>&1 && [ -f "${key}" ]; then
  echo
  read -r -p "  gh is logged in here. Set the secrets on GitHub directly now? [y/N] " answer
  if [ "${answer}" = y ] || [ "${answer}" = Y ]; then
    repo_slug="$(git remote get-url origin | sed -E 's#(git@github.com:|https://github.com/)##; s#\.git$##')"
    gh secret set VPS_HOST --repo "${repo_slug}" --body "${public_ip}"
    gh secret set VPS_USER --repo "${repo_slug}" --body "$(id -un)"
    gh secret set VPS_KNOWN_HOSTS --repo "${repo_slug}" --body "${host_keys}"
    gh secret set VPS_SSH_KEY --repo "${repo_slug}" < "${key}"
    [ "${ssh_port}" = 22 ] || gh secret set VPS_PORT --repo "${repo_slug}" --body "${ssh_port}"
    ok "secrets set on ${repo_slug}"
  fi
fi

step "Next"
echo "  1. Save the secrets in GitHub (never paste the private key anywhere else)."
echo "  2. Delete the private key here:        ./deploy/setup-remote-deploy.sh --cleanup"
echo "  3. Allow inbound TCP ${ssh_port} in the cloud firewall/security group (GitHub's runners use changing IPs)."
echo "  4. GitHub → Actions → CI / Deploy → Run workflow (branch: main)."
