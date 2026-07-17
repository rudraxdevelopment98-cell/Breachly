// The `-sumo` build includes crypto_pwhash (Argon2id), which the standard
// libsodium-wrappers build omits. We depend on Argon2id for key derivation.
import _sodium from 'libsodium-wrappers-sumo';

/**
 * libsodium loads its WASM asynchronously. Every crypto operation in this
 * package requires the library to be ready first. Call `initCrypto()` once at
 * app startup (web: root layout; RN: App root) and await it before using any
 * other export.
 */
let readyPromise: Promise<typeof _sodium> | null = null;

export async function initCrypto(): Promise<typeof _sodium> {
  if (!readyPromise) {
    readyPromise = _sodium.ready.then(() => _sodium);
  }
  return readyPromise;
}

/**
 * Synchronous accessor for code paths that are guaranteed to run after
 * `initCrypto()` has resolved. Throws if called too early — a loud failure is
 * better than a silent half-initialized cipher.
 */
export function sodium(): typeof _sodium {
  if (!readyPromise) {
    throw new Error(
      '@aegis/crypto used before initCrypto() resolved. Await initCrypto() at startup.',
    );
  }
  return _sodium;
}

export type Sodium = typeof _sodium;
