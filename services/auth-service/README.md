# auth-service

Identity, sessions, and MFA (aegis §4). **Zero-knowledge:** the server only ever
receives the client-derived `auth_key`, which it hashes again with Argon2id. It
never sees the password or the `encryption_key`, so it can never decrypt vault
or document data (principle #1).

## Endpoints

| Method | Path           | Purpose                                             |
| ------ | -------------- | --------------------------------------------------- |
| GET    | `/auth/salt`   | Fetch the user's Argon2id salt (derive keys pre-login) |
| POST   | `/auth/signup` | Create account (stores `authKeyHash`, `publicKey`)  |
| POST   | `/auth/login`  | Verify `auth_key` (+ TOTP if enabled) → tokens       |
| POST   | `/auth/refresh`| Rotate refresh token → new access + refresh          |

## Run

```bash
npm install
cp ../../.env.example ../../.env   # set AUTH_DATABASE_URL + JWT secrets
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

## Status (Phase 1 scaffold)

Implemented: signup/login with server-side Argon2id verification of the client
`auth_key`, refresh-token rotation, TOTP check, audit logging via `@aegis/audit`.
TODO: WebAuthn/passkey enrollment (§4), access-token guard middleware, rate
limiting, encrypt `totpSecret` at rest.
