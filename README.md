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

## Deployment notes

- **Next.js** — deploy to Vercel (or similar) for App Router + API routes + middleware
- **Socket.io** — deploy `server/socket-server.ts` to **Railway**, **Render**, or any long-running Node host. Vercel serverless does **not** support persistent WebSocket servers
- Set `NEXT_PUBLIC_SOCKET_URL` to your deployed socket origin in production
- PostgreSQL must have PostGIS enabled (`CREATE EXTENSION IF NOT EXISTS postgis;`)

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
