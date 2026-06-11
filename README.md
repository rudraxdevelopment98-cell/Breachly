# Breachly

Check whether your email has shown up in known data breaches — then keep
watching and get alerted the moment it shows up in a new one.

Built mobile-first with Expo (React Native) + TypeScript. See [`CLAUDE.md`](./CLAUDE.md)
for the full product brief.

## What’s built (MVP vertical slice)

- **Check screen** — email input → verdict, with a list of breaches (name,
  year, what leaked), plain-English **“Do this now”** steps, and a monitoring
  upsell card. Handles loading, clear, and error states.
- **`check-breach` Edge Function** — Supabase Edge Function that calls Have I
  Been Pwned with the secret API key server-side and returns clean JSON. The
  app never holds the key.

Not built yet (Phase 2): auth, RevenueCat paywall, monitoring backend,
password exposure check. See `CLAUDE.md` §5.

## Run it

```bash
npm install
npm start          # then press i (iOS), a (Android), or w (web)
```

By default the app runs in **mock mode** (`EXPO_PUBLIC_USE_MOCK=true`), so it
works with zero backend. Demo conventions for the email you enter:

| Email contains | Result                       |
| -------------- | ---------------------------- |
| `clear`        | No breaches found            |
| `error`        | Simulated error state        |
| anything else  | Sample breached result       |

## Go live (swap in the real lookup)

1. Create a Supabase project and a [HIBP API key](https://haveibeenpwned.com/API/Key).
2. Set the secret (server-side only):
   ```bash
   supabase secrets set HIBP_API_KEY=your_key_here
   supabase functions deploy check-breach
   ```
3. Copy `.env.example` → `.env` and set:
   ```
   EXPO_PUBLIC_USE_MOCK=false
   EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

The HIBP key lives **only** in the Edge Function. The mobile app never holds
secrets and never talks to HIBP directly (see `CLAUDE.md` §6, §7).

## Type check

```bash
npm run lint   # tsc --noEmit
```

## Layout

```
app/                     Expo Router screens
  _layout.tsx            Providers (React Query, SafeArea)
  index.tsx              The Check screen
src/
  api/                   checkBreach client + mock data
  components/            UI: ResultHeader, BreachCard, DoThisNow, MonitoringUpsell
  lib/guidance.ts        "Do this now" step builder
  theme/tokens.ts        Design tokens (§8)
  types.ts               Shared types
supabase/functions/
  check-breach/          Edge Function (HIBP lookup)
```
