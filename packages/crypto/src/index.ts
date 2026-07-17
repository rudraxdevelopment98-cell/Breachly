/**
 * @aegis/crypto — isomorphic zero-knowledge crypto core (aegis §5).
 *
 * Shared verbatim between the Next.js web client and the React Native (Expo)
 * mobile client. Nothing in this package ever runs server-side: the server is
 * designed never to hold plaintext, encryption keys, or document keys.
 *
 * Startup: `await initCrypto()` once, then use the rest.
 */
export { initCrypto, sodium, type Sodium } from './sodium';

export {
  toBase64,
  fromBase64,
  toHex,
  fromHex,
  utf8ToBytes,
  bytesToUtf8,
} from './encoding';

export {
  deriveKeys,
  generateSalt,
  authKeyForTransport,
  ARGON2_OPSLIMIT,
  ARGON2_MEMLIMIT,
  type DerivedKeys,
  type SaltInfo,
} from './kdf';

export {
  encrypt,
  decrypt,
  encryptBytes,
  decryptBytes,
  type Ciphertext,
} from './aead';

export {
  generateKeyPair,
  generateSymmetricKey,
  wrapKeyForRecipient,
  unwrapKey,
  type KeyPair,
} from './keys';

export { generateRecoveryKey, normalizeRecoveryKey } from './recovery';
