/**
 * Smoke test for @aegis/crypto — runnable proof the zero-knowledge core works
 * end to end. Run: `npm test` (uses tsx). Exits non-zero on any failure.
 *
 * This is intentionally dependency-light (no test framework) so it runs in any
 * environment. Phase 3's security review should replace/augment it with a full
 * vitest suite + known-answer vectors.
 */
import assert from 'node:assert/strict';
import {
  initCrypto,
  deriveKeys,
  generateSalt,
  authKeyForTransport,
  encrypt,
  decrypt,
  generateKeyPair,
  generateSymmetricKey,
  wrapKeyForRecipient,
  unwrapKey,
  generateRecoveryKey,
  normalizeRecoveryKey,
  toBase64,
} from '../src/index';

let passed = 0;
function check(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

async function main() {
  await initCrypto();
  console.log('@aegis/crypto smoke test\n');

  // 1. KDF: same password + salt → same keys; auth_key ≠ encryption_key.
  check('deriveKeys is deterministic and domain-separated', () => {
    const salt = generateSalt();
    const a = deriveKeys('correct horse battery staple', salt);
    const b = deriveKeys('correct horse battery staple', salt);
    assert.equal(toBase64(a.authKey), toBase64(b.authKey));
    assert.equal(toBase64(a.encryptionKey), toBase64(b.encryptionKey));
    assert.notEqual(toBase64(a.authKey), toBase64(a.encryptionKey));
    assert.equal(a.encryptionKey.length, 32);
  });

  // 2. Different salt → different keys (no cross-user rainbow reuse).
  check('different salt yields different keys', () => {
    const k1 = deriveKeys('pw', generateSalt());
    const k2 = deriveKeys('pw', generateSalt());
    assert.notEqual(toBase64(k1.authKey), toBase64(k2.authKey));
  });

  // 3. auth_key is transportable and reveals nothing about encryption_key.
  check('authKeyForTransport differs from encryption_key', () => {
    const keys = deriveKeys('pw', generateSalt());
    const transported = authKeyForTransport(keys);
    assert.notEqual(transported, toBase64(keys.encryptionKey));
  });

  // 4. AEAD round-trip encrypts the WHOLE item (metadata included).
  check('encrypt/decrypt round-trips full item incl. metadata', () => {
    const { encryptionKey } = deriveKeys('pw', generateSalt());
    const item = {
      type: 'password',
      title: 'Bank of Example', // metadata — encrypted, not plaintext
      url: 'https://bank.example.com',
      username: 'kuldeep',
      secret: 'S3cr3t!',
    };
    const box = encrypt(encryptionKey, item, 'item-123');
    const back = decrypt<typeof item>(encryptionKey, box, 'item-123');
    assert.deepEqual(back, item);
  });

  // 5. Wrong key / tampered AAD fails closed.
  check('AEAD fails on wrong key and wrong AAD', () => {
    const k1 = deriveKeys('pw1', generateSalt()).encryptionKey;
    const k2 = deriveKeys('pw2', generateSalt()).encryptionKey;
    const box = encrypt(k1, { secret: 'x' }, 'aad-a');
    assert.throws(() => decrypt(k2, box, 'aad-a'));
    assert.throws(() => decrypt(k1, box, 'aad-b'));
  });

  // 6. Nonces are unique per encryption.
  check('nonce is unique per encryption', () => {
    const { encryptionKey } = deriveKeys('pw', generateSalt());
    const a = encrypt(encryptionKey, { x: 1 });
    const b = encrypt(encryptionKey, { x: 1 });
    assert.notEqual(a.nonce, b.nonce);
    assert.notEqual(a.ct, b.ct);
  });

  // 7. Document sharing: wrap a file_key to a recipient, unwrap with their key.
  check('sealed-box key wrapping round-trips for recipient only', () => {
    const recipient = generateKeyPair();
    const attacker = generateKeyPair();
    const fileKey = generateSymmetricKey();

    const wrapped = wrapKeyForRecipient(fileKey, recipient.publicKey);
    const unwrapped = unwrapKey(wrapped, recipient);
    assert.equal(toBase64(unwrapped), toBase64(fileKey));

    // Attacker cannot open a box sealed to the recipient.
    assert.throws(() => unwrapKey(wrapped, attacker));
  });

  // 8. Revocation model: dropping one wrapped key doesn't affect another.
  check('independent grants: revoking one recipient leaves others intact', () => {
    const alice = generateKeyPair();
    const bob = generateKeyPair();
    const fileKey = generateSymmetricKey();
    const forAlice = wrapKeyForRecipient(fileKey, alice.publicKey);
    const forBob = wrapKeyForRecipient(fileKey, bob.publicKey);
    // "Revoke Alice" = discard forAlice. Bob's grant still works.
    assert.equal(toBase64(unwrapKey(forBob, bob)), toBase64(fileKey));
    assert.notEqual(forAlice, forBob);
  });

  // 9. Recovery key format + normalization.
  check('recovery key is high-entropy and normalizes', () => {
    const rk = generateRecoveryKey();
    assert.match(rk, /^[0-9A-HJKMNP-TV-Z]{5}(-[0-9A-HJKMNP-TV-Z]{5})+$/);
    assert.equal(normalizeRecoveryKey(rk), rk.replace(/-/g, ''));
  });

  console.log(`\nAll ${passed} checks passed.`);
}

main().catch((err) => {
  console.error('\n✗ smoke test failed:', err);
  process.exit(1);
});
