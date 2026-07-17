# @aegis/web

Next.js 14 (App Router) web client (aegis §4). Ships the Phase 1 **exposure
dashboard**: breach check + data-broker listing status.

## Run

```bash
npm install
npm run dev   # http://localhost:3000
```

Runs in **mock mode** by default (`NEXT_PUBLIC_USE_MOCK` unset/true) — no backend
needed. Enter an email containing `clear` to see the all-clear state. Point at
the live exposure-service by setting `NEXT_PUBLIC_USE_MOCK=false` and
`NEXT_PUBLIC_API_BASE`.

## Notes

- Shares `@aegis/crypto` and `@aegis/types` from the monorepo (transpiled from
  source via `transpilePackages`).
- All client-side encryption uses `@aegis/crypto` — the browser derives keys and
  encrypts/decrypts locally; the server never sees plaintext (principle #1).
