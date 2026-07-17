import { sodium } from './sodium';
import { fromBase64, toBase64, utf8ToBytes } from './encoding';

/**
 * Key derivation — aegis §5.
 *
 * A single master key is derived from the user's password via Argon2id, then
 * domain-separated into two independent subkeys:
 *
 *   - auth_key       → sent to the server for login verification ONLY.
 *                      The server stores a hash of it; it cannot decrypt anything.
 *   - encryption_key → NEVER leaves the device. Used locally to encrypt/decrypt
 *                      vault items and to wrap/unwrap document keys.
 *
 * Because both derive from the same master but through distinct KDF contexts,
 * knowledge of auth_key reveals nothing about encryption_key.
 */

// Argon2id parameters (aegis §5: memory_cost >= 64MB, iterations >= 3).
// Tune per-device with `benchmarkOpsLimit()` before raising above these floors.
export const ARGON2_OPSLIMIT = 3; // iterations
export const ARGON2_MEMLIMIT = 64 * 1024 * 1024; // 64 MiB
export const MASTER_KEY_BYTES = 32;
export const SUBKEY_BYTES = 32;

// crypto_kdf contexts must be exactly 8 bytes. Distinct contexts = domain sep.
const KDF_CONTEXT = 'aegisKDF';
const AUTH_SUBKEY_ID = 1;
const ENC_SUBKEY_ID = 2;

export interface DerivedKeys {
  /** Sent to the server for login only. Cannot decrypt anything. */
  authKey: Uint8Array;
  /** Stays on device. Encrypts vault items and wraps document keys. */
  encryptionKey: Uint8Array;
}

export interface SaltInfo {
  /** Argon2id salt (16 bytes), base64. Stored server-side, public per user. */
  salt: string;
}

/** Generate a fresh per-user Argon2id salt. Store it alongside the account. */
export function generateSalt(): SaltInfo {
  const s = sodium();
  return { salt: toBase64(s.randombytes_buf(s.crypto_pwhash_SALTBYTES)) };
}

/**
 * Derive { authKey, encryptionKey } from a password + the user's stored salt.
 * Runs entirely client-side.
 */
export function deriveKeys(password: string, saltInfo: SaltInfo): DerivedKeys {
  const s = sodium();
  const salt = fromBase64(saltInfo.salt);
  if (salt.length !== s.crypto_pwhash_SALTBYTES) {
    throw new Error('Invalid salt length for Argon2id.');
  }

  const master = s.crypto_pwhash(
    MASTER_KEY_BYTES,
    utf8ToBytes(password),
    salt,
    ARGON2_OPSLIMIT,
    ARGON2_MEMLIMIT,
    s.crypto_pwhash_ALG_ARGON2ID13,
  );

  const authKey = s.crypto_kdf_derive_from_key(
    SUBKEY_BYTES,
    AUTH_SUBKEY_ID,
    KDF_CONTEXT,
    master,
  );
  const encryptionKey = s.crypto_kdf_derive_from_key(
    SUBKEY_BYTES,
    ENC_SUBKEY_ID,
    KDF_CONTEXT,
    master,
  );

  // Wipe the master key from memory; only the subkeys should survive.
  s.memzero(master);

  return { authKey, encryptionKey };
}

/**
 * The auth_key encoded for transport to the server. This is all the server
 * ever receives for login — it then hashes THIS value server-side (never
 * storing it in the clear). See auth-service.
 */
export function authKeyForTransport(keys: DerivedKeys): string {
  return toBase64(keys.authKey);
}
