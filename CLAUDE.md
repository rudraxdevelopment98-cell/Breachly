# Breachly — build brief

> App name: **Breachly**.
> Owner: Kuldeep · Solo build · Mobile-first (iOS + Android).
> This file is standing context for Claude Code.

-----

## 1. What we’re building

A consumer app that tells people whether their email/passwords have been exposed in data breaches — and then **keeps watching and alerts them the moment they show up in a new one.**

The free “is my email leaked?” check is a hook. The business is **ongoing protection** (monitoring + alerts + password-reuse checks), which is what people actually pay for monthly.

**Positioning / moat:** built by a working security analyst. The differentiator is *trust and clear, correct guidance* — not just a scary number. Every result ends with plain-English “do this now” steps.

**Non-negotiable:** this is a security app. If it isn’t itself secure and privacy-respecting, it has no reason to exist. See §7.

## 2. Who it’s for

Everyday people (not security experts) who worry about being hacked. Broad appeal, simple language, no jargon. Secondary: people who reuse passwords and don’t know it.

## 3. How it makes money

Freemium subscription.

- **Free:** one-off breach check for an email; password exposure check; the “do this now” guidance.
- **Premium (~£2.99/mo or local equivalent):** continuous monitoring of multiple emails, instant alerts on new breaches, password-reuse/health checks, optional family plan later.

Payments via **RevenueCat** (handles App Store + Play in-app purchases in one SDK). Pricing is a starting guess — validate later.

## 4. Tech stack (this is also the reusable “engine” for future apps)

- **Expo (React Native) + TypeScript** — one codebase → iOS + Android.
- **Expo Router** — navigation.
- **Supabase** — auth, Postgres, and **Edge Functions** (server-side; see §6).
- **RevenueCat** (`react-native-purchases`) — subscriptions.
- **Expo Notifications** — breach alerts (push).
- **TanStack Query** for server state; keep local state minimal.
- Styling: plain RN styles / a light token system. Match the design in §8.

Keep it a monolith. No microservices, no over-engineering. Ship the vertical slice first.

## 5. Scope — build in this order

**MVP (build first, nothing else):**

1. The Check screen: email input → result (breached or clear).
2. If breached: list the breaches (name, year, what leaked) + “do this now” steps.
3. The monitoring upsell card (static for now — no backend yet).

**Phase 2 (only after MVP works end-to-end):**
4. Auth (Supabase) so a user can save emails to monitor.
5. RevenueCat paywall gating monitoring.
6. Monitoring backend: scheduled re-checks + push alert on new breach.
7. Password exposure check (k-anonymity, see §6).

**Later:** multiple emails, family plan, password-reuse audit, dark-web extras.

**Explicit non-goals (do NOT build yet):** VPN, antivirus, social features, Android-only system hooks, a web app. Resist scope creep.

## 6. Data sources & API rules

Use **Have I Been Pwned (HIBP)** — the trusted standard.

- **Email breach lookup:** HIBP `breachedaccount` endpoint. Requires an API key (`hibp-api-key` header). **The key must NEVER be in the mobile app.** Call HIBP from a **Supabase Edge Function** (`check-breach`); the app calls *your* function, which calls HIBP. This protects the key and lets you add caching + rate-limiting.
- **Password exposure check:** HIBP **Pwned Passwords range API** using **k-anonymity** — SHA-1 the password, send only the first 5 hash chars, match the returned suffixes locally. This is free, needs no key, and **never transmits the password.** This can run client-side because it’s safe by design.
- **Review HIBP’s commercial API terms and pricing before launch** — confirm the subscription tier and acceptable use for a paid product.

Architecture rule: anything involving a secret key or breach data lookup goes **server-side (Edge Function)**. The app never holds secrets.

## 7. Security & privacy (the credibility layer — get this right)

- **Never store user passwords.** Ever. Password checks are k-anonymity only.
- Store monitored emails **encrypted at rest**; collect the minimum data possible.
- Clear, honest **privacy policy** (required by both app stores anyway). State plainly what’s collected and that passwords are never sent.
- No third-party data selling. Make this a visible selling point.
- Give users a way to delete their account + data from inside the app (Play/App Store requirement).

## 8. Design direction

Calm, credible, trustworthy — **not** alarmist red-everywhere (that reads like a scam). Match this palette:

- Deep navy base (`#0B121A`), card surfaces (`#13202E`), hairlines (`#21364A`).
- Safe = mint green (`#46D6A6`); exposed = calm amber (`#F2B24B`); high severity = red (`#FF6B6B`) used sparingly; primary action = blue (`#5BA9F4`).
- Type: Inter for UI, a mono (JetBrains Mono) for counts/dates/labels.
- Tone of copy: plain, reassuring, active voice. “Do this now,” not “Remediation steps.”

## 9. Status

MVP vertical slice built: Check screen + `check-breach` Edge Function + wiring with
loading/clear/error states. Uses mock data when `EXPO_PUBLIC_USE_MOCK=true` (default),
swaps to the live Edge Function once Supabase + HIBP key are configured.

Do **not** add auth, paywall, or monitoring yet — get the core check solid first.

## 10. Accounts & keys needed (set up as you go)

- GitHub repo (this one).
- Supabase project (free tier) — for the Edge Function + later auth/DB.
- HIBP API key — for the email lookup (check pricing/terms first).
- Expo / EAS account (free) — for builds.
- Later, before publishing: Apple Developer ($99/yr), Google Play ($25 one-time), RevenueCat account, a privacy-policy URL.

## 11. Operating principles

- Ship the slice, then improve from real feedback. Don’t gold-plate.
- One engine, reused on future apps — keep auth/paywall/analytics modular.
- Measure installs + paying conversions; if it’s flat after 4–6 weeks of real effort, reassess.
- Distribution (ASO, launch) is half the job. Plan it, don’t just build.
