# Personal Data OS — codename **aegis**

> One app for exposure monitoring, passwords, and documents — with **zero-knowledge
> privacy by design.** See [`CLAUDE.md`](./CLAUDE.md) for the full product brief.

This repo began as *Breachly*, a mobile breach-checking MVP (now at
[`apps/mobile/`](./apps/mobile)). It has been re-scoped into the four-pillar
platform described in `CLAUDE.md`: exposure scanning + opt-out, a zero-knowledge
password vault, a zero-knowledge document vault with sharing, and age-tiered
family accounts.

## Monorepo layout

```
packages/
  crypto/          Zero-knowledge crypto core (Argon2id KDF, AEAD, X25519 wrapping)
                   — shared by web + mobile. VERIFIED (9/9 smoke tests pass).
  types/           Shared DTOs / enums across services + clients
  audit/           Reusable audit-log pipeline (principle #3: log every access)
services/
  auth-service/    NestJS — signup/login (Argon2id), sessions, JWT rotation, MFA
  exposure-service/NestJS — HIBP breach checks, curated broker registry, DROP adapter
apps/
  web/             Next.js 14 — Phase 1 exposure dashboard
  mobile/          Expo (React Native) — the original Breachly MVP, seeds the RN client
```

## Non-negotiable principles (`CLAUDE.md` §2)

1. Server never holds plaintext passwords, vault keys, or document keys.
2. All vault/document crypto happens client-side.
3. Every access to sensitive data is audit-logged.
4. Minor-account permissions are age-banded, not a blanket toggle.
5. Every sharing grant is independently, immediately revocable.

## Phase 1 status (Foundations + Exposure Scanner)

| Piece | Status |
| --- | --- |
| `packages/crypto` | ✅ Implemented + **verified** (`npm test` in the package) |
| `packages/types`, `packages/audit` | ✅ Implemented + typecheck clean |
| `auth-service` | ✅ Scaffold: Argon2id auth, sessions, JWT rotation, TOTP, audit |
| `exposure-service` | ✅ Scaffold: HIBP check, 20-broker registry, DROP adapter, audit |
| `apps/web` | ✅ Scaffold: exposure dashboard (mock mode by default) |
| `apps/mobile` | ✅ Preserved Breachly MVP |

Scaffolded services/apps need their own `npm install` to build/run (NestJS,
Next, Expo). The crypto core and shared packages are verified in CI-friendly
isolation. WebAuthn/passkey, the BullMQ opt-out queue, and live broker checking
are Phase 2+.

## Quick start

```bash
npm install   # once, from the repo root (installs all workspaces)
```

### Run the whole thing live (free — no DB, no API keys)

```bash
npm run dev            # starts exposure-service (:4002) + web (:3000) together,
                       # with the web app pointed at the REAL backend

npm run dev:mobile     # in another terminal — Expo for iPhone + Android,
                       # also pointed at the real backend
#   • physical device: install Expo Go, scan the QR
#   • iOS simulator: press i (Xcode)   • Android emulator: press a (Android Studio)
#   • on a physical device, set EXPO_PUBLIC_API_BASE to your machine's LAN IP
```

The backend runs with **zero infrastructure and zero cost**: with no `HIBP_API_KEY`
it serves realistic sample breach data, and with no `EXPOSURE_DATABASE_URL` it runs
without a database (audit logs go to stdout). So **whatever we build, you can see it**
across web + iPhone + Android immediately. It flips to live HIBP + persistence the
moment you add those (see below).

### Run pieces individually / in mock mode

```bash
npm test -w @aegis/crypto          # zero-knowledge crypto core, 9/9
npm run dev:api                    # just the exposure-service (:4002)
npm run dev -w @aegis/web          # just the web app in MOCK mode (no backend)
npm start -w @aegis/mobile         # just mobile in MOCK mode
```

### Add real persistence (still free, local)

```bash
npm run db:up                      # Postgres + Redis via Docker
# set AUTH_DATABASE_URL / EXPOSURE_DATABASE_URL in .env (see .env.example)
npm run prisma:migrate -w @aegis/exposure-service
npm run prisma:migrate -w @aegis/auth-service
npm run dev                        # now persists breach/broker/audit rows
```

### Go live with real breach data

Set `HIBP_API_KEY` (~$4/mo) in `.env` — the exposure-service automatically switches
from sample data to live HaveIBeenPwned lookups. The key stays server-side only.

Store-ready mobile binaries are built with EAS (`npx eas build -p ios|android`) —
see [`apps/mobile/README.md`](./apps/mobile/README.md).

Copy [`.env.example`](./.env.example) to `.env` and fill in secrets
(HIBP key, DB URLs, JWT secrets) to run the services live. **Secrets stay
server-side** — the HIBP key lives only in `exposure-service`.
