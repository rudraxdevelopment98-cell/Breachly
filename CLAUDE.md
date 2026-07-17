# Personal Data OS — codename **aegis**

> One app for exposure monitoring, passwords, and documents — with zero-knowledge privacy by design.
> Owner: Kuldeep · Solo build (security analyst background) · Web-first, mobile to follow.
> This file is standing context for Claude Code. It supersedes the earlier single-purpose "Breachly" brief.

> **History:** this project started as *Breachly*, a mobile-only breach-checking MVP. That MVP now lives at
> `apps/mobile/` and seeds the future React Native client. The product has been re-scoped to the platform
> described below. When guidance here conflicts with the old Breachly framing, **this file wins.**

-----

## 1. What we're building

A privacy-first personal data management platform combining four pillars:

1. **Exposure scanning + opt-out** — breach checks (HIBP) and data-broker exposure scans, with opt-out automation.
2. **Zero-knowledge password vault** — client-side encrypted secrets; server never sees plaintext.
3. **Zero-knowledge document vault** — client-side encrypted files with granular per-person / per-group sharing.
4. **Age-tiered family / minor accounts** — guardian visibility banded by age, not a single blanket toggle.

**Target users:** privacy-conscious individuals; families with minors; small teams wanting shared secure document storage.

**Moat / positioning:** built by a working security analyst. Differentiators are *correctness, zero-knowledge
rigor, and consequence-aware guidance* — not a scary number. Lean into the SIEM/detection background: the audit
pipeline can literally feed a detection dashboard.

## 2. Non-negotiable principles (do not violate these — ever)

1. The server must **never** possess plaintext passwords, vault encryption keys, or document encryption keys.
2. **All** vault/document encryption and decryption happens **client-side**.
3. **Every** access to sensitive data must be **audit-logged**.
4. Minor-account permission defaults must be **age-banded**, never a single blanket toggle.
5. **Every** sharing grant must be **independently and immediately revocable**.

## 3. Regulatory scope

UK GDPR · EU GDPR · ICO Children's Code (Age-Appropriate Design Code) · CCPA (if expanding to US).
Phases 3 and 5 have **mandatory review gates** — see §8. Do not launch those phases without sign-off.

## 4. Tech stack

**Frontend**
- Web: **Next.js 14 (App Router)**, **Tailwind CSS + shadcn/ui**.
- State: **Zustand** (client) + **React Query** (server cache).
- Crypto: **libsodium.js** (WebCrypto as fallback) — all client-side encryption.
- Mobile: **React Native (Expo)** sharing the core crypto module with web via a shared TS package (`packages/crypto`).

**Backend** — **NestJS** (Node/TS) for shared types with the frontend. Services, each with its **own DB schema**
(no shared tables):
- `auth-service` — identity, sessions, 2FA/WebAuthn.
- `vault-service` — encrypted password + document blobs, sharing grants.
- `exposure-service` — breach checks, broker scans, opt-out job queue.
- `family-service` — family spaces, minor tiers, guardian permissions.
- A **BFF layer** aggregates these for the client.

**Data stores**
- **PostgreSQL** (one logical schema per service, physically separable later) — via Prisma.
- **BullMQ** (Redis) for scan / opt-out / re-check recurring jobs.
- **S3-compatible** object storage for encrypted document blobs (**ciphertext only**, never touched server-side beyond storage).
- **Redis** cache.

**Auth**
- **Argon2id-derived `auth_key`** for login — separate from the `encryption_key`.
- **TOTP required**; **WebAuthn / passkey is a first-class login method** (baseline table stakes as of 2026, not a differentiator).
- **Passkey portability via CXP** (Credential Exchange Protocol) import/export — cross-platform sync is where competitors lose users.
- Short-lived **JWT + refresh-token rotation**.

**Hosting:** Vercel (frontend) + a container platform (Fly.io / Railway / AWS ECS) for backend services.
**Monitoring:** OpenTelemetry tracing + a SIEM-style audit-log pipeline.

## 5. Crypto design (this is the credibility layer — get it exactly right)

- **KDF:** Argon2id, `memory_cost >= 64MB`, `iterations >= 3`, tuned per device benchmark. Outputs:
  - `auth_key` — sent to server for login verification **only**; cannot decrypt anything.
  - `encryption_key` — **never leaves the device**; encrypts/decrypts vault + document keys locally.
- **Vault item encryption:** AES-256-GCM per item, unique nonce per item.
  **CRITICAL LESSON FROM THE LASTPASS 2022 BREACH:** encrypt **metadata** (site URLs, item titles, folder names)
  with the *same* rigor as the secret values. LastPass left metadata plaintext and it fuelled targeted phishing.
  Do **not** treat metadata as "low sensitivity, fine to keep plaintext for search convenience." This is the mistake to avoid.
- **Document encryption:** each document gets its own `file_key` (AES-256-GCM). The `file_key` is **wrapped**
  (encrypted) separately per recipient using the recipient's public key (X25519 sealed boxes via libsodium).
- **Sharing model:**
  - *Individual share:* `file_key` wrapped with recipient's `public_key`, stored as a `share_grant` row.
  - *Group share:* `file_key` wrapped with a `group_key`; the `group_key` is itself wrapped per member — so
    "share with Family" needs no per-person re-encryption on membership change.
  - *Revocation:* delete the wrapped-key row for that recipient/member — does not touch ciphertext or other grants.
  - *Expiring links:* `share_grant` has `expires_at` + `max_views`, enforced server-side at the grant level
    (server can withhold the wrapped key after expiry even though it can't read the document).
- **Recovery:** optional high-entropy recovery key generated at signup, shown once, stored offline by the user.
  **Explicit non-goal:** no "email me a reset link" flow for vault/document decryption — that would break zero-knowledge.

## 6. Data model (per service — see `docs/` / Prisma schemas for the source of truth)

- **auth-service:** `users` (id, email, phone, auth_key_hash, mfa_enabled, public_key, created_at), `sessions`.
- **vault-service:** `vault_items` (ciphertext, nonce, type), `documents` (s3_key, file_key_wrapped_for_owner),
  `share_grants` (grantee_type, wrapped_key, permission, expires_at, max_views), `groups`, `group_members`.
- **exposure-service:** `breach_records`, `broker_listings` (status: found|opt_out_pending|removed|reappeared),
  `opt_out_requests`.
- **family-service:** `family_spaces`, `family_members` (age_tier, permission_tier), `guardian_permissions`.
- **audit_log** (every service): id, actor_id, action, target_type, target_id, ip, timestamp.

## 7. Minor-account permission defaults (age-banded — principle #4)

- **Under 13 → `full_guardian_visibility`.** Guardian has full content access by default (COPPA-style duty of care).
- **Teen 13–17 → `shared_visibility_metadata_plus_alerts`.** Guardian sees *metadata* (categories of stored data,
  breach alerts involving the teen) and receives safety alerts, but **not** default full content access. Teen may
  grant specific item access voluntarily. Configurable by the guardian **within a bounded set** — never below the
  metadata+alerts floor, never forced to full-access-always. Mirrors Apple Family Sharing / Google Family Link and
  the ICO Children's Code.
- **Adult → `no_guardian_access`.** Standard independent account.
- **`requires_legal_review_before_launch: true`.**

## 8. Phases — build in this order

1. **Foundations + Exposure Scanner** *(current)* — monorepo; auth-service (signup/login, Argon2id, sessions);
   HIBP breach checks; curated broker-scan module (15–20 sites); exposure dashboard UI; **audit-logging pipeline
   (build once, reuse everywhere).**
2. **Opt-Out Workflow** — BullMQ job queue; semi-automated opt-out generation (human confirms send); recurring
   re-check jobs (quarterly) for reappearance; notifications.
3. **Zero-Knowledge Password Vault** — client crypto module; vault CRUD (ciphertext-only backend); password health
   checks (client-side); 2FA/WebAuthn unlock; recovery-key flow. **→ Independent security review / pentest before Phase 4.**
4. **Document Vault + Sharing** — client-side file_key encryption; S3 ciphertext blobs; individual + group share
   grants; expiring links + permission enforcement; revocation + per-document audit trail.
5. **Family Spaces + Minor Accounts** — family spaces; age-tier defaults; guardian metadata+alert view; age-appropriate
   consent flows. **→ LEGAL REVIEW CHECKPOINT — do not launch without sign-off.**
6. **Differentiators + Polish** — security-score dashboard; emergency/legacy access; panic/lockdown mode; mobile
   doc scanning (capture→crop→OCR→encrypted entry); full opt-out automation; **California DROP API** integration;
   **passkey CXP** import/export; **contextual/consequence-aware threat alerts**; **Travel Mode** (temporarily hide
   sensitive items on higher-risk devices / border crossings).

## 9. External APIs & integration rules

- **HaveIBeenPwned** — breach checks. Key is **server-side only** (exposure-service); the app never holds it.
- **California CalPrivacy DROP API** (Delete Request & Opt-Out Platform) — single-request deletion across CA-registered
  brokers; sandbox opens 2026. **Prioritize for CA users** before broader scraper coverage — it replaces dozens of
  fragile broker integrations with one legally-mandated API.
- **Broker scan targets outside DROP's scope** — start with a curated 15–20 high-traffic people-search sites; expand later.
- **Pluggable "registry adapter" pattern** — design the opt-out engine so equivalent state/country deletion platforms
  drop in without rearchitecting.

## 10. Market context (July 2026) — why these choices

- **Passkeys** are baseline across all major managers. Differentiation shifted to **cross-platform sync via CXP**.
- **LastPass 2022** exposed encrypted vaults + *unencrypted metadata*; that metadata enabled targeted phishing with
  losses still surfacing years later → metadata-level encryption is table stakes.
- **California Delete Act** (DROP, effective Jan 1 2026; brokers must act from Aug 1 2026 or face $200/day/request).
- **AI threat evolution** — AI-generated phishing ~4× click-through vs human; voice-cloning fraud rising → static
  breach lists matter less than **contextual, consequence-aware alerts**.
- **Family features that win** — 1Password's shared+private vaults, organizer role, and **Travel Mode** are the benchmark.

## 11. Open questions for the founder (affect the critical path — surface, don't guess)

1. Which **jurisdiction launches first** (drives which compliance work is critical-path)?
2. Do documents/passwords **sync offline-first**, or always require connectivity?
3. **Pricing** — freemium exposure scan with paid vault/family tiers, or single subscription?
4. **Who performs** the pre-Phase-3 and pre-Phase-5 security/legal reviews (budget + timeline dependency)?

## 12. Operating principles

- Build phase by phase; each phase is the smallest shippable, reviewable slice. Don't boil the ocean.
- The four non-negotiables in §2 are hard gates on every PR, not aspirations.
- One reusable engine (auth / crypto / audit) — keep it modular.
- Distribution is half the job. Plan launch per §11.1.
