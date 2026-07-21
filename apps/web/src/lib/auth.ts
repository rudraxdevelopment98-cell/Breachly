'use client';

import type { AuthTokens, SaltResponse } from '@aegis/types';

/**
 * Zero-knowledge auth client (aegis §5).
 *
 * The password NEVER leaves the browser. We derive auth_key + encryption_key
 * locally via Argon2id (@aegis/crypto), send only auth_key to the server, and
 * keep encryption_key in memory. The crypto core is dynamically imported so its
 * WebAssembly stays client-only and never runs during SSR.
 */
const AUTH_BASE = process.env.NEXT_PUBLIC_AUTH_BASE ?? 'http://localhost:4001';

export interface AuthOutcome {
  tokens: AuthTokens;
  email: string;
  /** encryption_key (base64) — held in memory only by the caller. */
  encryptionKeyB64: string;
}

export async function signup(
  emailRaw: string,
  password: string,
): Promise<AuthOutcome> {
  const email = emailRaw.trim().toLowerCase();
  const c = await import('@aegis/crypto');
  await c.initCrypto();

  const salt = c.generateSalt();
  const keys = c.deriveKeys(password, salt);
  const keypair = c.generateKeyPair();

  const res = await fetch(`${AUTH_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email,
      authKey: c.authKeyForTransport(keys),
      salt: salt.salt,
      publicKey: keypair.publicKey,
    }),
  });

  if (res.status === 409) throw new Error('An account with that email already exists.');
  if (!res.ok) throw new Error('Could not create the account. Please try again.');

  const tokens = (await res.json()) as AuthTokens;
  return { tokens, email, encryptionKeyB64: c.toBase64(keys.encryptionKey) };
}

export async function login(
  emailRaw: string,
  password: string,
): Promise<AuthOutcome> {
  const email = emailRaw.trim().toLowerCase();
  const c = await import('@aegis/crypto');
  await c.initCrypto();

  // Fetch the account's Argon2id salt, then derive keys locally.
  const saltRes = await fetch(
    `${AUTH_BASE}/auth/salt?email=${encodeURIComponent(email)}`,
  );
  const { salt } = (await saltRes.json()) as SaltResponse;
  if (!salt) throw new Error('No account found for that email.');

  const keys = c.deriveKeys(password, { salt });

  const res = await fetch(`${AUTH_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, authKey: c.authKeyForTransport(keys) }),
  });

  if (!res.ok) throw new Error('Invalid email or password.');

  const tokens = (await res.json()) as AuthTokens;
  return { tokens, email, encryptionKeyB64: c.toBase64(keys.encryptionKey) };
}
