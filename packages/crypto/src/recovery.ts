import { sodium } from './sodium';

/**
 * Recovery key — aegis §5.
 *
 * A high-entropy secret generated once at signup, shown to the user, and
 * stored offline by them. It can wrap the encryption_key so the account is
 * recoverable WITHOUT the server ever being able to decrypt anything.
 *
 * Explicit non-goal: there is no "email me a reset link" path for vault/
 * document decryption — that would break zero-knowledge.
 */

// 20 random bytes → 160 bits of entropy, grouped for legibility.
const RECOVERY_ENTROPY_BYTES = 20;
const GROUP_SIZE = 5;
// Crockford base32 alphabet (no I, L, O, U — avoids transcription errors).
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/** Generate a formatted recovery key, e.g. "K7QF2-9MRT4-...". */
export function generateRecoveryKey(): string {
  const bytes = sodium().randombytes_buf(RECOVERY_ENTROPY_BYTES);
  let out = '';
  for (const b of bytes) {
    out += ALPHABET[b % ALPHABET.length];
  }
  return (out.match(new RegExp(`.{1,${GROUP_SIZE}}`, 'g')) ?? []).join('-');
}

/** Normalize user input (strip spaces/hyphens, uppercase) before use. */
export function normalizeRecoveryKey(input: string): string {
  return input.replace(/[\s-]/g, '').toUpperCase();
}
