# Backups: orders, customers and stock

Everything the shop can't recreate lives in two places on the VPS:
- **The database:** orders, customers, products, batches, stock.
- **`wp-content/uploads`:** product photos.

The code isn't in that list: GitHub has it.

```
03:17 every night (cron)
  deploy/backup.sh
    ├─ db-YYYYMMDD-HHMM.sql.gz        checked: valid gzip + "Dump completed" line
    ├─ uploads-YYYYMMDD-HHMM.tar.gz   checked: readable archive
    ├─ keeps 14 days in deploy/backups/ on the VPS
    └─ copies to BACKUP_REMOTE (encrypted, off the server), keeps 60 days there
```

A backup on the same disk as the shop protects against mistakes, not against losing the server.
**Set up the off-server copy (step 2).**

## 1. Turn on nightly backups (2 minutes)

```bash
cd /opt/sawargi-coffee && git pull
./deploy/backup.sh                  # one now: should print "backup: … saved"
./deploy/install-backup-cron.sh     # every night at 03:17 server time
./deploy/verify-backup.sh           # restore drill (below): should end with "verify: OK"
```

## 2. Copy them off the server, encrypted (10 minutes, once)

The backups contain customers' names, addresses and phone numbers, so they go off the server
**encrypted**. [rclone](https://rclone.org) handles both the copy and the encryption.

**The quick way:** one script does everything except signing in to Google:
```bash
./deploy/setup-backup-remote.sh
```
1. It asks you to run `rclone authorize "drive"` on your Mac (`brew install rclone` first). Sign
   in with the Google account that should hold the backups, then paste the token line it prints.
2. It creates the encrypted remote with two generated passwords and **shows them once**. Put them
   in your password manager before typing `saved`.
3. It sets `BACKUP_REMOTE=sawargi-crypt:` in `deploy/.env` and runs a backup, which should end
   with `copied off-server`.

**By hand:** the steps below do the same thing. They use Google Drive (15 GB free); any rclone
backend works the same way (Cloudflare R2, Backblaze B2, S3…).

**On the VPS:**
```bash
sudo apt install -y rclone
rclone config
```
1. `n` (new remote) → name `gdrive` → storage `drive` → leave client id/secret empty →
   scope `1` (full access) → leave the rest at the defaults.
2. *"Use web browser to automatically authenticate?"* → **`n`**. rclone prints a command like
   `rclone authorize "drive" "…"`.
3. **On your Mac:** `brew install rclone`, then paste that command. A browser opens; sign in to
   Google; the terminal prints a token. Paste the token back into the VPS.
4. Still in `rclone config`: `n` (new remote) → name `sawargi-crypt` → storage `crypt` →
   remote `gdrive:sawargi-backups` → filename encryption `1` (standard) → directory name
   encryption `1` → password **`g` (generate)**, 256 bits → salt password **`g`** too.
5. **Save both generated passwords in your password manager now.** Without them the backups
   can't be decrypted by anyone, including you.
6. `q` to quit.

Then tell the backup to use it. Add to `deploy/.env`:
```bash
BACKUP_REMOTE=sawargi-crypt:
```
Check:
```bash
./deploy/backup.sh               # should end with "backup: copied off-server to sawargi-crypt:"
rclone ls sawargi-crypt:         # lists the decrypted names
rclone ls gdrive:sawargi-backups # Google only sees scrambled names
```

### Use a dedicated Google account and your own client ID

Two things the setup above leaves you with need fixing:

- **rclone's shared Google client is being retired during 2026.** When Google turns it off, the
  off-server copy stops and the backup fails after saving locally. rclone warns with "This remote
  uses rclone's shared Google Drive client_id".
- **Scope `drive` gives the server your whole Google Drive.** If anything on the VPS is
  compromised, every file in that Drive is exposed. So sign rclone in with a **Google account used
  only for backups** (a new free Gmail), not your personal one.

**Your own client ID (Google Cloud Console, about 15 minutes):**
1. Create a project and enable **Google Drive API** (APIs & Services → Library).
2. **Google Auth Platform → Branding:** app name and support email. Links can stay empty; if
   Google insists, use the shop's privacy policy page (`…/sawargi-coffee/shop/privacy-policy/`).
3. **Audience:** type **External**, add the backup account as a test user, then **Publish app**.
   An app left in *Testing* has its login expire after 7 days, and the nightly copy breaks
   silently.
4. **Clients → Create client → Desktop app.** Put the client ID and secret in your password manager.

**Point rclone at it (on the VPS):**
1. `rclone config` → `e` → `gdrive` → paste client ID and secret → keep scope `drive` → advanced `n`.
2. Refresh the token: answer **`y`** to "refresh?". For the login, choose one of these:
   - **Tunnel:** connect with `ssh -L 53682:127.0.0.1:53682 ubuntu@<vps>`, answer **`y`** to
     auto config and open the printed link on your Mac.
   - **No tunnel:** answer **`n`**, run the printed `rclone authorize "drive" "eyJ…"` on your Mac,
     and paste the result back.
3. In the browser, sign in with the **backup account**. On "Google hasn't verified this app", click
   **Advanced → Go to … (unsafe)**. The blue **"Back to safety"** button cancels the login, and
   rclone reports "No code returned". Tick the Google Drive permission, then **Continue**.
4. Check: `rclone lsd gdrive:` shows no client_id notice, and `./deploy/backup.sh` ends with
   `copied off-server`. The crypt passwords don't change.

Later, you can re-sign in to the same remote with `rclone config reconnect gdrive:`.

Troubleshooting:
- **`Error 403: access_denied`:** the app is still in Testing and the account isn't a test user.
- **`bind: address already in use` on 53682:** an old tunnel or `rclone authorize` holds the port.
  Find it with `lsof -nP -iTCP:53682 -sTCP:LISTEN` (Mac) or `sudo ss -ltnp 'sport = :53682'`
  (VPS), then close it.
- **Repeated `channel 3: open failed`:** the tunnel has nothing to forward to (rclone isn't
  listening). It's harmless once rclone has printed "Got code".

### Prove the passwords work without the server

The server's rclone config holds the keys; if the server dies, only your password manager does.
Prove it once, from your Mac:
1. `rclone config` → new remote `gdrive` (same account) → new remote `sawargi-crypt`: crypt,
   `gdrive:sawargi-backups`, standard, directory names `true`. For both passwords choose
   **"type in my own"** and paste from the password manager.
2. `rclone ls sawargi-crypt:` must list readable `db-…`/`uploads-…` names.
   "Skipping undecryptable file name: bad PKCS#7 padding" means a wrong password or salt.
   Compare with the server's: `rclone reveal` on each `password`/`password2` value in
   `~/.config/rclone/rclone.conf`.
3. `rclone cat sawargi-crypt:db-STAMP.sql.gz | gunzip | head -c 300` shows `-- MariaDB dump`.

## 3. Restore drill (monthly, 1 minute)

```bash
./deploy/verify-backup.sh            # newest backup
./deploy/verify-backup.sh deploy/backups/db-20261001-0317.sql.gz
```
It loads the backup into a **throwaway** MariaDB container and prints products, grind
variations and orders, next to the same counts from the live shop. Nothing live is touched.
A backup you've never restored is a guess; this turns it into a fact.

## 4. Restoring for real

**Before anything else**, take a backup of the current state: `./deploy/backup.sh`. Even a broken
shop has orders you may need.

**Undo a mistake (same server):**
```bash
cd /opt/sawargi-coffee/deploy
set -a; source .env; set +a
ls backups/                                   # pick the stamp to go back to
docker compose stop wordpress
zcat backups/db-STAMP.sql.gz | docker compose exec -T -e MYSQL_PWD="$DB_ROOT_PASSWORD" db mariadb -u root "$DB_NAME"
docker compose run --rm -T --entrypoint tar wpcli xzf - < backups/uploads-STAMP.tar.gz
docker compose start wordpress
```
Orders placed after STAMP are not in that backup. Note them first (WooCommerce → Orders).

**The server is gone (new VPS):**
1. Follow `docs/cms/WORDPRESS.md` §1–§2 up to and including `docker compose up -d`. **Skip
   `bootstrap-wordpress.sh`**: the backup already contains the installed shop.
2. Set up the same rclone remotes (step 2, using the **saved** crypt passwords), then:
   ```bash
   rclone copy sawargi-crypt: deploy/backups/ --include 'db-STAMP*' --include 'uploads-STAMP*'
   ```
3. Run the "same server" commands above.
4. Redo `docs/cms/REMOTE-DEPLOY.md` (new server = new deploy key and host key), then re-run the
   last GitHub deploy.

## Settings (`deploy/.env`)

| Variable | Default | Meaning |
| --- | --- | --- |
| `BACKUP_REMOTE` | empty | rclone remote for the off-server copy, e.g. `sawargi-crypt:`. Empty = this server only (warns) |
| `BACKUP_KEEP_DAYS` | `14` | days kept on the VPS |
| `BACKUP_REMOTE_KEEP_DAYS` | `60` | days kept off the server |

## Checking that it runs

```bash
tail -n 20 deploy/backups/backup.log     # one "saved" (+ "copied off-server") line per night
ls -lt deploy/backups | head             # newest files on top
crontab -l | grep sawargi-backup         # the schedule
```
