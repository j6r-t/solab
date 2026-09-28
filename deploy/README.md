# Solab Optics — Production Deployment Kit

Self-contained deployment kit for the Solab optics-shop ERP (Next.js 16 + Prisma 6 / SQLite).

Everything in this folder is copy-pasteable. No source code is modified by this kit.

---

## 1. Overview — two deployment paths

| | PATH A — Shop PC + Cloudflare Tunnel | PATH B — Oracle Cloud VPS + Caddy |
|---|---|---|
| Cost | **0 DT** (no server, no card) | Free tier VPS, but account needs **card validation once** |
| Hardware | The shop's Windows PC | Always-on Ubuntu VM |
| Public URL | Your domain via Cloudflare Tunnel (no open ports) | Your domain, DNS A record → VPS, HTTPS via Caddy |
| Uptime | Only while the PC is on | 24/7 |
| Best when | Shop PC stays on during business hours, zero budget | You need the app reachable at all times |

**Choose Path A** if the PC at the shop stays on all day and you want to spend nothing.
**Choose Path B** if you already validated an Oracle Cloud account and want always-on hosting.

Both paths share the same **Common prep** (section 3) and the same **backup strategy** (section 7).

> Note on Caddy/systemd/cloudflared files: the `deploy/caddy/` and `deploy/systemd/` files are used by Path B only; `deploy/cloudflared/` by Path A only. None of them harm the other OS.

---

## 2. What's in this kit

```
deploy/
├── README.md                      ← this guide
├── env.production.example         ← template for the production .env
├── caddy/
│   └── Caddyfile                  ← reverse proxy + HTTPS (Path B)
├── systemd/
│   └── solab.service              ← keep the app running on the VPS (Path B)
├── cloudflared/
│   └── config.yml.example         ← tunnel config (Path A)
├── backup/
│   ├── backup.sh                  ← daily SQLite backup (Linux / Path B)
│   ├── restore.sh                 ← restore a backup (Linux / Path B)
│   └── backup.ps1                 ← daily SQLite backup (Windows / Path A)
└── windows/
    └── start-solab.cmd            ← helper so Task Scheduler can launch `npm start` (Path A)
```

---

## 3. Common prep (both paths)

### 3.1 Install Node.js LTS

- **Windows (Path A):**
  ```powershell
  winget install OpenJS.NodeJS.LTS
  ```
  Close and reopen the terminal, then check: `node -v` (Node 20 or 22 LTS both work).
- **Ubuntu (Path B):**
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
  ```

### 3.2 Install dependencies

From the project root:

```bash
npm ci
```

### 3.3 Create the production `.env`

Copy the template and edit it:

```bash
cp deploy/env.production.example .env
```

Variables the app actually reads (verified in the source code):

| Variable | Required | Where it's used |
|---|---|---|
| `DATABASE_URL` | yes | `prisma.config.ts` / `prisma/schema.prisma` — SQLite file location |
| `JWT_SECRET` | **yes** | `src/lib/constants/index.ts` — signs auth tokens |
| `GROQ_API_KEY` | optional | `src/app/api/ocr-prescription/route.ts` — OCR. If absent the app works fine; only the OCR endpoint refuses to run |
| `GROQ_MODEL` | optional | same OCR route (default used in the repo: `groq/compound`) |
| `NODE_ENV` | set to `production` | error verbosity, secure cookies, blocks dev backdoors |
| `PORT` | optional (default 3000) | honored by `next start` |

> **The auth secret in this codebase is `JWT_SECRET`.** There is no `AUTH_SECRET` variable — use `JWT_SECRET`.

**Generate a strong `JWT_SECRET`** (Node is installed after step 3.1, so this works on Windows and Linux):

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

Paste the output into `JWT_SECRET=`. **Never reuse the development secret from your dev `.env` — consider it exposed.**

**DATABASE_URL form** (matches the repo convention — `file:` paths are resolved **relative to the `prisma/` folder**, where `schema.prisma` lives):

```
DATABASE_URL=file:./db/production.db
```

→ this file will be created at `prisma/db/production.db` (the dev database `prisma/db/dev.db` uses exactly this convention).
On the VPS you may also use an absolute path to be independent of any working directory:

```
DATABASE_URL=file:/opt/solab/prisma/db/production.db
```

**Keep `.env` safe:** never commit it, never put it inside a backup archive. Store a copy in a password manager or printed in a sealed envelope at the shop.

### 3.4 Create the production database schema

> ⚠️ **Backup first if the database already exists.** `db push` modifies the SQLite file in place.
> For a fresh production database this is safe.

```bash
npx prisma db push
npx prisma generate
node scripts/backfill-optician-bills.mjs
```

Run the backfill **once, before the app is used**: it creates bills for historical optician work orders that predate bills (it is idempotent and can be re-run safely).

(The project also contains a `prisma/migrations/` folder kept for reference; day-to-day schema management here is `prisma db push`, which is what you should use on deploy. Do not run `migrate deploy` unless you know the migration history is in sync.)

Do **NOT** run `npm run db:seed` in production — the seed creates demo users (`owner@sofien.tn` / `admin123`) and demo data.

### 3.5 Build and run

```bash
npm run build
npm start          # serves on http://localhost:3000 (or $PORT)
```

Next.js 16 note: this project builds with Turbopack and runs with `next start` (no standalone output is configured). If you ever see a production error about `sharp` for image optimization, run `npm i sharp` and rebuild — nothing else in the app needs native dependencies.

---

## 4. PATH A — Shop Windows PC + Cloudflare Tunnel (0 DT)

Prerequisites: a domain added to Cloudflare (free plan is fine), Node installed (3.1), app prepped and building (3.2–3.5).

### 4.1 Install cloudflared

```powershell
winget install --id Cloudflare.cloudflared
```

Reopen the terminal, then: `cloudflared --version`.

### 4.2 Authenticate and create the tunnel

```powershell
cloudflared tunnel login
```

A browser opens — pick your domain in the Cloudflare dashboard.

```powershell
cloudflared tunnel create sofien-optic
```

Note the **tunnel ID** and the **credentials file path** it prints (under `C:\Users\<you>\.cloudflared\<TUNNEL-ID>.json`).

### 4.3 Configure the tunnel

Copy `deploy\cloudflared\config.yml.example` to `C:\Users\<you>\.cloudflared\config.yml` and fill in:

- `<TUNNEL-ID>` → your tunnel ID
- credentials-file path from step 4.2
- `hostname` → the subdomain you want, e.g. `shop.yourdomain.tn`

Then route DNS:

```powershell
cloudflared tunnel route dns sofien-optic shop.yourdomain.tn
```

Test it in the foreground first:

```powershell
cloudflared tunnel run sofien-optic
```

Open `https://shop.yourdomain.tn` — the app should respond. Ctrl+C when verified.

### 4.4 Install cloudflared as a Windows service

```powershell
cloudflared service install
Start-Service cloudflared
```

The service reads the `config.yml` from the `.cloudflared` folder of the user that ran `login`.

### 4.5 Keep Next.js running (Task Scheduler)

Edit `deploy\windows\start-solab.cmd` only if your project is not at the default location — it resolves the project root from its own location (`deploy\windows\`), so it usually needs **no edits**.

Register a logon task (adjust the path if you moved the project):

```powershell
schtasks /Create /TN "Solab App" /SC ONLOGON /RL HIGHEST /TR "\"C:\Users\jesse\Desktop\study\iset_me\solab\deploy\windows\start-solab.cmd\""
```

Test now without rebooting:

```powershell
schtasks /Run /TN "Solab App"
```

The app starts on port 3000; the tunnel (already a service) forwards the domain to it.

### 4.6 Daily backup on Windows

`deploy\backup\backup.ps1` compresses the production DB to `%USERPROFILE%\Backups\solab\` and prunes backups older than 14 days. Register it daily at 23:00 (run once in PowerShell **as Administrator**):

```powershell
$act  = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"C:\Users\jesse\Desktop\study\iset_me\solab\deploy\backup\backup.ps1`""
$trg  = New-ScheduledTaskTrigger -Daily -At 23:00
Register-ScheduledTask -TaskName "Solab Backup" -Action $act -Trigger $trg -RunLevel Highest
```

(The same snippet is included as a comment at the bottom of `backup.ps1`.)

### 4.7 Path A reminder

The shop PC must stay powered on and logged in for the app to be reachable. Backups live on the same disk — copy the `%USERPROFILE%\Backups\solab\` folder to an external drive regularly.

---

## 5. PATH B — Oracle Cloud Always-Free Ubuntu VPS + Caddy + systemd

### 5.1 Create the VPS

Oracle Cloud → Always Free → Ubuntu 22.04/24.04 VM. Note the public IP. In the Oracle console open ingress ports 22, 80, 443.

### 5.2 Create a non-root user and log in

```bash
ssh ubuntu@<VPS-IP>
sudo adduser solab
sudo usermod -aG sudo solab
```

(Optionally add your SSH key to `/home/solab/.ssh/authorized_keys` and log in as `solab` from now on.)

### 5.3 Install Node LTS and Caddy

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs caddy sqlite3
```

(`sqlite3` is needed by the backup script.)

### 5.4 Copy the app to /opt/solab

Either clone from git or copy the folder from Windows:

```powershell
# from the shop PC (PowerShell) — copies the project without node_modules/.next
scp -r .\* ubuntu@<VPS-IP>:/tmp/solab-src/
```

```bash
# on the VPS
sudo mkdir -p /opt/solab
sudo cp -r /tmp/solab-src/. /opt/solab/
sudo chown -R solab:solab /opt/solab
rm -rf /tmp/solab-src
```

### 5.5 Configure, build, push schema

```bash
cd /opt/solab
cp deploy/env.production.example .env
nano .env        # JWT_SECRET (generate per §3.3), DATABASE_URL, GROQ_API_KEY optional
npm ci
npx prisma db push
npx prisma generate
npm run build
```

### 5.6 Install the systemd service

```bash
sudo cp deploy/systemd/solab.service /etc/systemd/system/solab.service
sudo systemctl daemon-reload
sudo systemctl enable --now solab
systemctl status solab          # should be "active (running)"
curl -s http://localhost:3000 >/dev/null && echo APP-OK
```

The unit runs as user `solab`, writes are restricted to `/opt/solab/prisma` (where the SQLite file lives) via `ReadWritePaths`.

### 5.7 Caddy (HTTPS reverse proxy)

Point a DNS **A record** for e.g. `shop.yourdomain.tn` at the VPS public IP, then:

```bash
sudo cp deploy/caddy/Caddyfile /etc/caddy/Caddyfile
sudo nano /etc/caddy/Caddyfile   # set your real domain (or leave {$DOMAIN} and set it in /etc/default/caddy? simpler: edit the file)
sudo systemctl reload caddy
```

Caddy obtains and renews the Let's Encrypt certificate automatically. Verify: `https://shop.yourdomain.tn`.

### 5.8 Firewall (ufw)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

### 5.9 Daily backup on the VPS

```bash
sudo crontab -e -u solab
```

Add the line (also present as a comment in `backup.sh`):

```cron
0 23 * * * /opt/solab/deploy/backup/backup.sh >> /opt/solab/backups/backup.log 2>&1
```

Then: `chmod +x /opt/solab/deploy/backup/*.sh` once.

---

## 6. Updates (both paths)

1. **Backup first** (run the backup script manually).
2. Get the new code:
   - Path A (Windows): `git pull` (or copy the updated folder over the old one, without `.env`, `node_modules`, `.next`, `prisma/db/`).
   - Path B (VPS): `cd /opt/solab && sudo -u solab git pull` (or scp-copy as in 5.4).
3. **Stop the app** before touching Prisma:
   - Path A (Windows): close the `start-solab.cmd` window, or stop the Node process / the "Solab App" task (`schtasks /End /TN "Solab App"`).
   - Path B (VPS): `sudo systemctl stop solab`.
4. Update the database schema and rebuild:
   ```bash
   npm ci
   npx prisma db push      # no-op if schema unchanged — still safe, backup taken in step 1
   npx prisma generate
   npm run build
   ```
5. Restart:
   - Path A: re-run `start-solab.cmd` (or Task Scheduler → `schtasks /Run /TN "Solab App"`).
   - Path B: `sudo systemctl start solab`.

Updating Prisma while the app is running can fail with an EPERM lock on the SQLite DLL, or leave the server on a stale Prisma client (500 errors) until restart — that is why the app must be stopped first.

---

## 7. Backups and restore

### Backups

| Path | Script | Destination | Schedule |
|---|---|---|---|
| A (Windows) | `deploy\backup\backup.ps1` | `%USERPROFILE%\Backups\solab\solab-YYYYMMDD-HHMMSS.db.zip` | daily 23:00 (§4.6) |
| B (Linux) | `deploy/backup/backup.sh` | `/opt/solab/backups/solab-YYYYMMDD-HHMMSS.db.gz` | daily 23:00 (§5.9) |

Both use SQLite's safe online `.backup` command (consistent copy even while the app is running) and keep 14 days by default.
**Secrets are deliberately NOT backed up** — `.env` stays out of the archives; store it separately and safely (§3.3).

### Restore

**Stop the app first** — restoring over a running SQLite file corrupts data.

- Path B: `CONFIRM=prod /opt/solab/deploy/backup/restore.sh /opt/solab/backups/solab-XXXXXXXX-XXXXXX.db.gz` (or add `--force`; the script refuses to run otherwise), then `sudo systemctl start solab`.
- Path A: stop the "Solab App" task, replace `prisma\db\production.db` with the `.db` file extracted from the zip backup, start the task again.

**Always test one restore before going live** — a backup you can't restore is not a backup.

---

## 8. Pre-production checklist

- [ ] `JWT_SECRET` is a strong, **newly generated** value (`node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"`), never reused from development
- [ ] `GROQ_API_KEY` **rotated** — the old key lived in the dev `.env` and must be considered exposed; revoke it at console.groq.com and create a fresh one (or leave it blank — the app works without it; only OCR is disabled)
- [ ] Demo users removed or password-changed — `owner@sofien.tn` / `admin123` from the seed must not work; real admin account uses a strong password
- [ ] `npm run db:seed` was **not** run against the production database
- [ ] **Verify removed:** the dev backdoor `POST /api/dev/reset-admin-password` (`src/app/api/dev/reset-admin-password/route.ts`) is deleted — it currently guards on `NODE_ENV === production`, but it must not exist in the deployed code
- [ ] `NODE_ENV=production` in `.env`
- [ ] HTTPS live at the final URL (Cloudflare edge or Caddy certificate)
- [ ] First backup taken **and a restore tested** on a scratch copy
- [ ] OCR prescription upload works (with key) or fails gracefully (without key) — the rest of the app is unaffected either way
- [ ] Backups scheduled (Task Scheduler / cron) and copying off-machine (external drive / separate location)

---

## 9. Notes

- **Line endings:** all `.sh`, `.service`, `Caddyfile` and `.yml` files in this kit were written with LF line endings. If you edit them on Windows and a Linux script suddenly fails with `\r` errors, run `dos2unix <file>` on the VPS.
- No new npm dependencies are required by this kit.
- The Caddyfile, systemd unit and cloudflared config contain **placeholder values only** — nothing secret is stored in this kit.
