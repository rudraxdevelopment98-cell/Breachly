# exposure-service

Breach checks + data-broker exposure scanning (aegis §4, §9). The **HIBP API key
lives here only** — it is never sent to any client (principle: secrets stay
server-side).

## Endpoints

| Method | Path                        | Purpose                                   |
| ------ | --------------------------- | ----------------------------------------- |
| POST   | `/exposure/breach-check`    | HIBP lookup for an email → clean JSON      |
| POST   | `/exposure/broker-scan`     | Return curated broker targets for a user   |

## Pluggable registry adapters (§9)

Deletion platforms implement `RegistryAdapter`. The **California DROP** adapter
(`src/brokers/adapters/ca-drop.adapter.ts`) is the reference: one API call
replaces dozens of per-site scrapers for CA-registered brokers. Equivalent
state/country platforms drop in without rearchitecting. The DROP sandbox opens
2026; until `CA_DROP_API_*` are set, the adapter defers to per-site opt-out.

## Run

```bash
npm install
# set HIBP_API_KEY + EXPOSURE_DATABASE_URL in ../../.env
npm run prisma:generate && npm run prisma:migrate
npm run dev
```

## Status (Phase 1 scaffold)

Implemented: HIBP breach check (ported from the original Breachly Edge Function),
curated 20-broker registry, DROP adapter pattern, audit logging.
TODO (Phase 2): BullMQ job queue for scheduled re-checks + reappearance
detection; live broker checking; opt-out request generation.
