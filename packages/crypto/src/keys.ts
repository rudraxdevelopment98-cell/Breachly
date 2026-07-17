import { sodium } from './sodium';
import { fromBase64, toBase64 } from './encoding';

/**
 * Asymmetric key wrapping for document sharing — aegis §5.
 *
 * Each document has its own random `file_key`. To share, the `file_key` is
 * WRAPPED (sealed) to a recipient's X25519 public key. Only the holder of the
 * matching secret key can unwrap it. Group shares wrap a `group_key` the same
 * way, and the `group_key` wraps the `file_key` — so membership changes never
 * require re-encrypting documents. Revocation = delete the one wrapped-key row.
 */

export interface KeyPair {
  /** X25519 public key, base64 — safe to publish (stored in users.public_key). */
  publicKey: string;
  /** X25519 secret key, base64 — client-side only, itself encrypted at rest. */
  secretKey: string;
}

/** Generate a user's X25519 keypair (for sealed-box share wrapping). */
export function generateKeyPair(): KeyPair {
  const s = sodium();
  const kp = s.crypto_box_keypair();
  return {
    publicKey: toBase64(kp.publicKey),
    secretKey: toBase64(kp.privateKey),
  };
}

/** Fresh random 32-byte symmetric key (document file_key or group_key). */
export function generateSymmetricKey(): Uint8Array {
  return sodium().randombytes_buf(32);
}

/**
 * Wrap a symmetric key (file_key / group_key) to a recipient's public key using
 * an anonymous sealed box. The sender identity is not revealed; only the
 * recipient's secret key can open it.
 */
export function wrapKeyForRecipient(
  key: Uint8Array,
  recipientPublicKeyB64: string,
): string {
  const s = sodium();
  const sealed = s.crypto_box_seal(key, fromBase64(recipientPublicKeyB64));
  return toBase64(sealed);
}

/** Unwrap a sealed key with the recipient's own keypair. */
export function unwrapKey(
  wrappedB64: string,
  recipient: KeyPair,
): Uint8Array {
  const s = sodium();
  return s.crypto_box_seal_open(
    fromBase64(wrappedB64),
    fromBase64(recipient.publicKey),
    fromBase64(recipient.secretKey),
  );
}

export { fromBase64 as keyFromBase64, toBase64 as keyToBase64 };
