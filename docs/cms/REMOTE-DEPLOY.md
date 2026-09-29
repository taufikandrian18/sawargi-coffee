# Remote deploy: GitHub → VPS, step by step

After this one-time setup, **merging a pull request into `main` updates the live site by
itself**. You never SSH in to deploy again.

```
merge PR ──► GitHub Actions: npm ci · type-check · tests · lint · build for /sawargi-coffee
                 │  (any failure stops here; the live site is untouched)
                 ▼
             ssh ubuntu@VPS  "<commit SHA>"  < site.tar.gz
                 │  the deploy key can ONLY run deploy/remote-deploy.sh (forced command)
                 ▼
VPS:         remote-deploy.sh
               1. checks tools, docker, repo state (the same checks as `check`)
               2. fast-forwards /opt/sawargi-coffee to that exact commit
               3. deploy/ changed?    → docker compose up -d
                  Caddyfile changed?  → recreate sawargi-caddy
                  plugin changed?     → restart WordPress
               4. swaps the new site into deploy/site (atomic rsync)
```

**What never goes through this pipeline:** batches, stock, prices and orders. They live in
WooCommerce, and the site reads them live.

---

## Before you start

- [ ] PR [#12](https://github.com/taufikandrian18/sawargi-coffee/pull/12) (this pipeline) is merged
      into `main`. Its first automatic run fails at "Deploy to the VPS". That's expected until
      step 3 is done.
- [ ] You can SSH into the VPS as `ubuntu`, and the site already runs (`docs/cms/WORDPRESS.md` §2).
- [ ] You have admin access to the GitHub repo, which you need for **Settings → Secrets**.

Allow about 15 minutes. Run long commands inside `tmux`: the VPS is short on memory, and a
dropped SSH session shouldn't kill them.

---

## Step 1: Bring the VPS up to date

```bash
cd /opt/sawargi-coffee
git status --short          # must print nothing (except '??' lines). Edited tracked files block deploys.
git pull
cd deploy && docker compose up -d && cd ..
```

**If `git status` lists `M` lines,** someone edited tracked files on the server. Save a copy of
anything you need, then run `git checkout -- <file>`. From now on, every change goes through
GitHub.

## Step 2: Run the setup script on the VPS

```bash
cd /opt/sawargi-coffee
./deploy/setup-remote-deploy.sh
```

It never needs `sudo`; run it as `ubuntu`. It does four things, and stops with a plain-English
fix if anything is wrong:

1. **Checks the VPS:**
   - the tools it needs are installed;
   - `ubuntu` can use Docker without sudo;
   - the repo is owned by `ubuntu`, is on `main`, and can pull from GitHub.
2. **Creates the deploy key** (`~/.ssh/sawargi-deploy-key`) and adds it to `~/.ssh/authorized_keys`
   with `command="…/remote-deploy.sh",restrict`. That key can only trigger a deploy: no shell,
   no file access, no port forwarding.
3. **Tests the key through real SSH:**
   - It asks for `check`, which runs the deploy's preflight and changes nothing. You should see
     `remote-deploy: ready.`
   - It tries to run `id` with the key and confirms that's refused.
4. **Prints the values for GitHub:** `VPS_HOST` (the public IP), `VPS_USER`, `VPS_KNOWN_HOSTS`
   (the VPS's identity), and the private key.

**SSH on another port?** Run `SSH_PORT=2222 ./deploy/setup-remote-deploy.sh` instead.

**If the public IP is detected wrong** (e.g. behind a NAT), run
`VPS_PUBLIC_IP=1.2.3.4 ./deploy/setup-remote-deploy.sh`.

You can re-run it any time. It reuses the key and keeps exactly one `authorized_keys` line for it.

## Step 3: Add the secrets on GitHub

Go to the repo → **Settings → Secrets and variables → Actions → New repository secret**, and
create each one, copied from the script's output:

| Name | Value |
| --- | --- |
| `VPS_HOST` | The public IP |
| `VPS_USER` | `ubuntu` |
| `VPS_KNOWN_HOSTS` | Every line between `BEGIN VPS_KNOWN_HOSTS` and `END VPS_KNOWN_HOSTS` |
| `VPS_SSH_KEY` | Everything between `BEGIN VPS_SSH_KEY` and `END VPS_SSH_KEY`, including the `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END …-----` lines |
| `VPS_PORT` | Only if SSH isn't on port 22 |

**If the GitHub CLI (`gh`) is logged in on the VPS,** the script offers to set all of these for
you.

**The private key goes into GitHub and nowhere else:** not a chat, not a note, not the repo.
Once it's saved, delete it from the VPS:

```bash
./deploy/setup-remote-deploy.sh --cleanup
```

## Step 4: Let GitHub reach SSH

GitHub's runners connect from changing IP addresses, so port 22 must accept connections from
the internet. On Tencent Cloud (and most providers), this is set in the console:

- **Where:** Security Group → Inbound rules.
- **What:** allow `TCP 22` from `0.0.0.0/0`. If it's already open for you from anywhere, you're done.

Opening SSH is safe only with passwords off. Check:

```bash
sudo sshd -T | grep -E '^(passwordauthentication|permitrootlogin|pubkeyauthentication)'
```

You want `passwordauthentication no`, `permitrootlogin no` (or `prohibit-password`), and
`pubkeyauthentication yes`. If passwords are still on:

- **First** confirm your own key login works.
- **Then** set `PasswordAuthentication no` in `/etc/ssh/sshd_config` (or in a file under
  `/etc/ssh/sshd_config.d/`), and run `sudo systemctl reload ssh`.
- **Keep your current session open** until a new one logs in fine.

## Step 5: The first deploy

On GitHub, go to **Actions → CI / Deploy → Run workflow → branch `main` → Run workflow**.

Open the run. You should see:

```
✓ npm ci · tsc · test · lint · build · Package the site
✓ Deploy to the VPS
    remote-deploy: code 1a2b3c4 → 1a2b3c4
    remote-deploy: site 1a2b3c4 is live.
```

Then open https://website.taufikandrian.my.id/sawargi-coffee/ and hard-refresh (Ctrl+Shift+R).

**From now on:** merge a PR into `main` → wait about 2 minutes → it's live. The **Actions** tab
shows each deploy and why one failed.

---

## Troubleshooting

The error appears in the failed run under **Deploy to the VPS**.

| Error | Cause | Fix |
| --- | --- | --- |
| `Deploy secrets are missing` | A secret isn't set, or its name is misspelled | Step 3. Names are case-sensitive |
| `ssh: connect to host … port 22: Connection timed out` | Cloud firewall blocks GitHub | Step 4 |
| `Host key verification failed` | `VPS_KNOWN_HOSTS` is wrong, or the VPS was rebuilt | Re-run the setup script and update `VPS_KNOWN_HOSTS` |
| `Permission denied (publickey)` | `VPS_SSH_KEY` is incomplete (missing BEGIN/END lines), or the `authorized_keys` line is gone | Re-run the setup script (it re-adds the line), then paste the whole key again |
| `Load key … invalid format` | The key was pasted with missing lines | Paste it again, exactly as printed |
| `remote-deploy: tracked files were edited on the VPS` | Someone changed repo files on the server | On the VPS: `git status`, then `git checkout -- <file>`. Change things through GitHub instead |
| `remote-deploy: can't fetch from GitHub` | The VPS can't reach GitHub, or the repo needs credentials | On the VPS: `cd /opt/sawargi-coffee && git fetch origin main` shows the real error |
| `remote-deploy: can't run docker compose as ubuntu` | `ubuntu` isn't in the `docker` group, or `deploy/.env` is missing | `sudo usermod -aG docker ubuntu`, then log out and in |
| `remote-deploy: … is older than what's live; skipping.` | You re-ran an old workflow run | Not an error. To roll back, see below |
| Tests or build fail before the deploy step | A real problem in the code | Nothing was deployed. Fix it in a PR |

Test the VPS side on its own at any time, without deploying anything:

```bash
./deploy/setup-remote-deploy.sh      # step 3 of its output runs `check` through SSH
```

## Rolling back

Deploys only move forward, so re-running an old workflow run does nothing. To undo a bad change:

1. On GitHub, open the merged PR and click **Revert**. That creates a PR which undoes it.
2. Merge the revert PR. The pipeline deploys it like any other change.

**In a hurry, on the VPS:**
`cd /opt/sawargi-coffee && git revert --no-edit HEAD && ./deploy/build-site.sh`. Then push the
revert to GitHub, or the next deploy fails, because the VPS would have a commit GitHub doesn't.

## Rotating or revoking the key

- **Revoke:** delete the `sawargi-github-deploy` line from `~/.ssh/authorized_keys` on the VPS,
  and delete the `VPS_SSH_KEY` secret. Deploys stop immediately.
- **Rotate:** revoke as above and `rm ~/.ssh/sawargi-deploy-key.pub`, then redo steps 2 and 3.

## Manual deploy (if GitHub is down)

```bash
cd /opt/sawargi-coffee && git pull && ./deploy/build-site.sh
cd deploy && docker compose up -d --force-recreate caddy    # only if deploy/Caddyfile changed
```
