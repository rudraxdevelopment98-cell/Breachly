# @aegis/mobile

The aegis mobile app — **one Expo (React Native) codebase → iPhone + Android**.
Started life as the Breachly MVP and now shares types (`@aegis/types`) and the
same backend contract (`exposure-service`) as the web app.

## Run it

```bash
# from the repo root, after: npm install
npm start -w @aegis/mobile        # opens the Expo dev server + QR code
```

Then:
- **iPhone / Android (physical device):** install **Expo Go**, scan the QR code.
- **iOS simulator:** press `i` (needs Xcode, macOS).
- **Android emulator:** press `a` (needs Android Studio).

Runs in **mock mode** by default (`EXPO_PUBLIC_USE_MOCK=true`) — no backend
needed. Enter any email to see a breached result; include `clear` for the
all-clear state.

## Point at the live backend

Copy `.env.example` → `.env` and set:

```
EXPO_PUBLIC_USE_MOCK=false
EXPO_PUBLIC_API_BASE=http://<your-machine-LAN-IP>:4002   # exposure-service
```

On a physical device use your machine's LAN IP (not `localhost`). The app calls
the same `POST /exposure/breach-check` endpoint as the web client; the HIBP key
stays server-side.

## Production builds (store-ready binaries)

Native `.ipa` / `.aab` builds are produced with **EAS Build** (needs an Expo
account; no local Xcode/Android Studio required):

```bash
npx eas build --platform ios
npx eas build --platform android
```

CI verifies the JS bundles for both platforms on every push (`expo export`).

## Monorepo notes

`metro.config.js` is configured for the workspace (watches the repo root,
resolves hoisted + `@aegis/*` packages). Type-only imports from `@aegis/types`
are erased at build time, so no extra runtime wiring is required.
