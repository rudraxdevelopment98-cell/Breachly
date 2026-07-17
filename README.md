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
# Verify the zero-knowledge crypto core (no backend needed):
cd packages/crypto && npm install && npm test

# Run the web exposure dashboard in mock mode:
cd apps/web && npm install && npm run dev   # http://localhost:3000

# Run the original Breachly mobile MVP:
cd apps/mobile && npm install && npm start
```

Copy [`.env.example`](./.env.example) to `.env` and fill in secrets
(HIBP key, DB URLs, JWT secrets) to run the services live. **Secrets stay
server-side** — the HIBP key lives only in `exposure-service`.
