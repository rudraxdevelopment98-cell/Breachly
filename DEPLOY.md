# Deploying aegis (free tiers)

Everything below is **£0** on free tiers. The frontend is already deployable to
Vercel; this covers hosting the backend + database so real accounts work on a
public URL.

## Architecture

```
 Browser ──► Vercel (Next.js web)  ──►  Render (auth-service + exposure-service)  ──►  Postgres
                                                                                     (Render or Supabase/Neon)
```

The HIBP key and DB live only on the backend. The browser holds no secrets.

---

## 1. Database (pick one, all have a free tier)

- **Render Postgres** — simplest if you host the backend on Render (same dashboard).
- **Supabase** — https://supabase.com → New project → *Settings → Database → Connection string* (URI).
- **Neon** — https://neon.tech → new project → copy the connection string.

You'll get a URL like `postgresql://user:pass@host:5432/dbname`. Each service
uses its **own schema** on that database — append `?schema=auth` for auth-service
and `?schema=exposure` for exposure-service (they each have an `audit_log` table,
so they must not share one schema).

## 2. Backend (Render — one account hosts both services)

1. Create a free account at https://render.com and connect this GitHub repo.
2. Create **two** Web Services (one per service) with these settings:

   **auth-service**
   - Build: `npm ci --include=dev && npm run prisma:generate -w @aegis/auth-service && npx prisma migrate deploy --schema services/auth-service/prisma/schema.prisma`
   - Start: `npm run start:prod -w @aegis/auth-service`
   - Env: `AUTH_DATABASE_URL=<db url>?schema=auth`, `JWT_ACCESS_SECRET=<random>`, `JWT_REFRESH_SECRET=<random>`

   **exposure-service**
   - Build: `npm ci --include=dev && npm run prisma:generate -w @aegis/exposure-service && npx prisma migrate deploy --schema services/exposure-service/prisma/schema.prisma`
   - Start: `npm run start:prod -w @aegis/exposure-service`
   - Env: `EXPOSURE_DATABASE_URL=<db url>?schema=exposure` (add `HIBP_API_KEY` later for live breach data)

   Both bind to Render's injected `PORT` automatically.

3. Note each service's public URL, e.g. `https://aegis-auth-service.onrender.com`.

> Free Render services sleep when idle and cold-start on the next request — fine
> for a demo, expect a few seconds on the first hit.

## 3. Frontend (Vercel)

Redeploy the web app from `apps/web` and set these environment variables:

```
NEXT_PUBLIC_USE_MOCK=false
NEXT_PUBLIC_AUTH_BASE=https://<auth-service>.onrender.com
NEXT_PUBLIC_API_BASE=https://<exposure-service>.onrender.com
```

Now signup/login and the breach check hit the real backend.

## 4. Go live with real breach data

Set `HIBP_API_KEY` on the exposure-service (~$4/mo). It switches from sample data
to live HaveIBeenPwned automatically. The key never reaches the client.

---

## See it locally instead (no accounts needed)

```bash
npm run db:up                                   # Docker Postgres + Redis
npm run prisma:migrate -w @aegis/auth-service
npm run prisma:migrate -w @aegis/exposure-service
npm run dev                                      # web + exposure-service
npm run dev:api                                  # (auth-service, if not already)
```
