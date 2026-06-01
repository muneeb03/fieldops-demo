# FieldOps Demo

Next.js 14 technical demo for Upwork — three capabilities in one repo:

1. **Multi-tenant middleware** — subdomain → mock Redis lookup → `x-tenant-id` header
2. **PostGIS geofence** — `ST_Contains` point-in-polygon via Prisma `$queryRaw`
3. **Real-time Socket.io** — separate Node server (not Vercel serverless) with live counter sync

## Stack

- Next.js 14 (App Router), TypeScript (strict)
- Prisma + PostgreSQL + PostGIS
- Socket.io (standalone server on port 4000)
- Tailwind CSS

## Prerequisites

- Node.js 18+
- PostgreSQL with [PostGIS](https://postgis.net/) available
- (Optional) `/etc/hosts` entries if your OS does not resolve `*.localhost` subdomains

## Quick start

```bash
cd fieldops-demo
npm install
cp .env.example .env
# Edit DATABASE_URL if needed
npm run prisma:generate
npx prisma db push
```

Enable PostGIS on your database (once), using the **same public** `DATABASE_URL` as Prisma (Railway Query tab, `psql`, or Prisma):

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
SELECT PostGIS_Version();
```

### Railway: no PostGIS on default Postgres

Railway’s **Database → Extensions** tab only lists extensions bundled with their standard Postgres image (`postgres_fdw`, `dblink`, etc.). **PostGIS is not there** because it is not installed on the server — `CREATE EXTENSION postgis` cannot add it; the OS must ship PostGIS libraries first.

Your `fieldops-demo-db` service cannot run geofence queries until you use a PostGIS-capable database.

**Path A — Local PostGIS (fastest for the demo)**

```bash
docker compose up -d
```

Set `.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fieldops?schema=public"
```

```bash
npx prisma db push
```

In any SQL client (or `docker compose exec postgis psql -U postgres -d fieldops`):

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
SELECT PostGIS_Version();
```

**Path B — PostGIS on Railway**

Add a **new** service (keep or remove the old DB as you prefer):

1. [PostGIS template](https://railway.com/deploy/postgis) — `postgis/postgis` image with PostGIS pre-installed, or  
2. [PostgreSQL Extensions](https://railway.com/deploy/postgresql-extensions) — set `EXTENSIONS` to include PostGIS at deploy time

Copy that service’s **public** `DATABASE_URL` into `.env`, run `npx prisma db push`, then the same `CREATE EXTENSION` / `PostGIS_Version()` SQL in the Query tab.

You cannot enable PostGIS on an existing standard Railway Postgres plugin by toggling Extensions or SQL alone.

### Supabase PostgreSQL (Prisma + PostGIS)

1. Supabase dashboard → **Project Settings → Database** → copy the connection string into `.env` as `DATABASE_URL` (Prisma does **not** read `.env.local` for migrations).
2. If direct host `db.<ref>.supabase.co` fails (**Not IPv4 compatible**), use **Session pooler** on port **5432** (not Transaction pooler **6543** — that port hangs or fails on `prisma db push`).
3. URL-encode special characters in the password (`!` → `%21`, etc.).
4. SQL Editor (same project):

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
SELECT PostGIS_Version();
```

5. `npx prisma db push`

Run in two terminals:

```bash
# Terminal 1 — Next.js (port 3000)
npm run dev

# Terminal 2 — Socket.io (port 4000)
npm run socket
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

| Variable | Example | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/fieldops?schema=public` | Prisma / PostGIS |
| `NEXT_PUBLIC_SOCKET_URL` | `http://localhost:4000` | Client Socket.io URL |

### Railway PostgreSQL from your laptop

Railway provides two connection strings:

| Host | Use when |
|------|----------|
| `postgres.railway.internal` | App runs **on Railway** (private network) |
| `*.proxy.rlwy.net` or similar **public** host | `prisma db push`, local `npm run dev`, psql from your Mac |

If `npx prisma db push` fails with **Can't reach database server at `postgres.railway.internal`**, your `.env` has the internal URL. In the Railway dashboard → your Postgres service → **Connect** → copy the **public** URL (or enable TCP proxy) and set `DATABASE_URL` to that for local work.

Keep the internal URL only in Railway service variables for deployed apps, not in local `.env`.

## Localhost subdomain testing

Modern browsers resolve `acme.localhost` without `/etc/hosts`. If subdomains fail, add:

```
127.0.0.1 acme.localhost
127.0.0.1 beta.localhost
127.0.0.1 unknown.localhost
```

Then test:

| URL | Expected |
|-----|----------|
| [http://acme.localhost:3000](http://acme.localhost:3000) | Home shows `tenant-acme-001`; `GET /api/tenant` returns same |
| [http://beta.localhost:3000](http://beta.localhost:3000) | `tenant-beta-002` |
| [http://unknown.localhost:3000](http://unknown.localhost:3000) | **404** — unknown tenant |
| [http://localhost:3000](http://localhost:3000) | No tenant (middleware skips plain `localhost`) |

Middleware reads `Host`, extracts subdomain, looks up a mock in-memory Map (`lib/tenant-store.ts`), and sets `x-tenant-id` on valid tenants.

## Testing the three requirements

### 1. Multi-tenant middleware

- Visit `acme.localhost:3000` — home page shows resolved tenant ID
- `curl -H "Host: acme.localhost:3000" http://localhost:3000/api/tenant`
- `curl -H "Host: unknown.localhost:3000" http://localhost:3000/` → 404

### 2. PostGIS geofence

UI: [http://localhost:3000/geofence](http://localhost:3000/geofence)

```bash
# Inside polygon (sample)
curl -X POST http://localhost:3000/api/geofence/check \
  -H "Content-Type: application/json" \
  -d '{"lat":40.710,"lng":-74.000}'

# Outside polygon (sample)
curl -X POST http://localhost:3000/api/geofence/check \
  -H "Content-Type: application/json" \
  -d '{"lat":40.730,"lng":-74.000}'
```

Response shape: `{ "inside": true|false, "lat": number, "lng": number }`

Hardcoded polygon (WGS84):

```
POLYGON((-74.010 40.700, -73.990 40.700, -73.990 40.720, -74.010 40.720, -74.010 40.700))
```

If PostGIS is missing, the API returns `503` with setup hint.

### 3. Real-time Socket.io

UI: [http://localhost:3000/realtime](http://localhost:3000/realtime)

1. Ensure `npm run socket` is running
2. Open `/realtime` in two browser tabs
3. Click **Increment Counter** in one tab — both counters update in under 500ms

Events: client emits `increment-counter`; server broadcasts `counter-updated`.

## Project scripts

| Script | Command |
|--------|---------|
| `npm run dev` | Start Next.js dev server |
| `npm run socket` | Start Socket.io server (`server/socket-server.ts`) |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run build` | Production build |
| `npm run start` | Production Next.js |

## Deploy to Vercel + Railway

Split deployment: **Vercel** runs Next.js (middleware, API routes, UI). **Railway** runs the long-lived Socket.io process. Vercel cannot host persistent WebSockets.

### Prerequisites

- Git repo pushed to GitHub (or GitLab/Bitbucket)
- Supabase project with PostGIS enabled and `prisma db push` already run
- Two URLs after deploy: `https://your-app.vercel.app` and `https://your-socket.up.railway.app`

---

### 1. Deploy Socket.io on Railway

1. [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo** → select `fieldops-demo`.
2. Open the new service → **Settings**:
   - **Start Command:** `npm run start:socket` (or use repo `railway.toml`)
   - **Watch paths** (optional): `server/`, `package.json`
3. **Variables** (service → Variables):

   | Variable | Value |
   |----------|--------|
   | `CORS_ORIGIN` | `https://YOUR-APP.vercel.app` (add `,http://localhost:3000` for local testing) |

   Railway sets `PORT` automatically — do not hardcode it.

4. **Settings → Networking → Generate domain** → copy the public URL, e.g. `https://fieldops-socket-production.up.railway.app`
5. Deploy. Check **Deploy Logs** for `Socket.io server listening on port …`.

**Test:** open `https://YOUR-RAILWAY-URL` in a browser — you may see a blank page or connection error (normal); the server is WebSocket-only. Use the Next.js `/realtime` page to test.

---

### 2. Deploy Next.js on Vercel

1. [vercel.com](https://vercel.com) → **Add New Project** → import the same repo.
2. Framework: **Next.js** (auto-detected). Build command: `npm run build` (runs `prisma generate && next build`).
3. **Environment Variables** (Production + Preview):

   | Variable | Value |
   |----------|--------|
   | `DATABASE_URL` | Supabase **Session pooler** `:5432` URL (same as local `.env`) |
   | `NEXT_PUBLIC_SOCKET_URL` | Railway public URL, e.g. `https://fieldops-socket-production.up.railway.app` |
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://toweotawqcslnpflwyst.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Your Supabase publishable key |
   | `TENANT_BASE_DOMAIN` | Your domain, e.g. `yourdomain.com` (after DNS setup) |
   | `NEXT_PUBLIC_TENANT_BASE_DOMAIN` | Same as above (shows live tenant links on home) |

   Do **not** put secrets only needed on the socket service on Vercel unless the app uses them.

4. **Deploy**. Note your Vercel URL: `https://your-app.vercel.app`.

5. **Update Railway `CORS_ORIGIN`** to your real Vercel URL and redeploy Railway if you used a placeholder.

6. **Redeploy Vercel** if you changed `NEXT_PUBLIC_SOCKET_URL` (public env vars are baked in at build time).

---

### 3. Verify production

| Check | URL / action |
|-------|----------------|
| Home | `https://your-app.vercel.app` |
| Geofence | `/geofence` — inside point `40.710, -74.000` |
| Realtime | `/realtime` — two tabs, increment counter |
| Tenant | See [Tenant demo on live URL](#tenant-demo-on-live-url) below |
| Todos | `/todos` — Supabase table + RLS policies |

Socket client uses `NEXT_PUBLIC_SOCKET_URL` with `wss://` automatically when the page is served over HTTPS.

---

### Tenant demo on live URL

Vercel assigns one hostname per project (`fieldops-demo-beta.vercel.app`). You **cannot** create `acme.fieldops-demo-beta.vercel.app` on `*.vercel.app`. Tenant middleware reads the **Host** header, so production tenants need **your own domain** with real subdomains.

#### Option A — Custom domain on Vercel (live `acme.` / `beta.` links)

1. Use any domain you control (Namecheap, Cloudflare, etc.).
2. **Vercel** → Project → **Settings → Domains** → add:
   - `yourdomain.com` (optional apex)
   - `acme.yourdomain.com`
   - `beta.yourdomain.com`
   - `unknown.yourdomain.com` (to demo 404)
3. At your DNS provider, add **CNAME** records Vercel shows (each subdomain → `cname.vercel-dns.com` or similar).
4. **Vercel → Environment Variables** (Production):

   | Variable | Example |
   |----------|---------|
   | `TENANT_BASE_DOMAIN` | `yourdomain.com` |
   | `NEXT_PUBLIC_TENANT_BASE_DOMAIN` | `yourdomain.com` |

5. **Redeploy** Vercel.
6. Test:
   - https://acme.yourdomain.com → `tenant-acme-001`
   - https://beta.yourdomain.com → `tenant-beta-002`
   - https://unknown.yourdomain.com → **404** Tenant not found
   - https://yourdomain.com → home, no tenant (apex)

The home page lists production tenant links when `NEXT_PUBLIC_TENANT_BASE_DOMAIN` is set.

#### Option B — Local only (no domain)

- http://acme.localhost:3000  
- http://beta.localhost:3000  
- http://unknown.localhost:3000 → 404  

Mention this in your Upwork proposal if you have not added a custom domain yet.

---

### 4. Supabase + Prisma on Vercel

- Run **`npx prisma db push`** from your machine (Session pooler `:5432`), not on Vercel build, unless you add a CI step.
- Enable PostGIS once in Supabase SQL Editor.
- Optional: use Supabase **transaction pooler** `:6543` + `?pgbouncer=true` for `DATABASE_URL` on Vercel if you hit connection limits; keep Session `:5432` for migrations locally.

---

### 5. Troubleshooting

| Issue | Fix |
|-------|-----|
| Realtime “Cannot connect” | `NEXT_PUBLIC_SOCKET_URL` must match Railway URL exactly (https, no trailing slash). Redeploy Vercel after changing. |
| CORS error in browser console | Set Railway `CORS_ORIGIN` to your Vercel origin (scheme + host, no path). |
| Geofence 503 | `CREATE EXTENSION postgis` on Supabase. |
| `prisma db push` hangs | Use pooler port **5432**, not **6543**. |
| Tenant 404 on Vercel | Fixed: `*.vercel.app` is ignored by middleware. For `acme.yourdomain.com`, set `TENANT_BASE_DOMAIN=yourdomain.com` on Vercel and add DNS subdomains. |

---

### Architecture

```text
Browser → Vercel (Next.js, API, middleware)
Browser → Railway (Socket.io, port from $PORT)
Vercel API → Supabase Postgres (PostGIS)
```

## Project layout

```
app/
  page.tsx              # Home — tenant display + nav
  geofence/page.tsx     # Geofence UI
  realtime/page.tsx     # Socket.io client
  api/
    tenant/route.ts     # Returns x-tenant-id
    geofence/check/     # POST PostGIS check
middleware.ts           # Subdomain → tenant header
lib/
  subdomain.ts          # Host parsing
  tenant-store.ts       # Mock Redis Map
  prisma.ts
server/
  socket-server.ts      # Port 4000
prisma/schema.prisma
```
