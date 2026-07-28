'use client';

import type {
  CredentialSecret,
  DecryptedVaultItem,
  VaultItemCipher,
  VaultItemType,
} from '@aegis/types';

/**
 * Zero-knowledge vault client (aegis §5).
 *
 * The whole item — INCLUDING metadata like title and URL (the LastPass 2022
 * lesson) — is encrypted on the device with the user's encryption_key before it
 * ever leaves the browser. The server stores and returns ciphertext only.
 */
const VAULT_BASE = process.env.NEXT_PUBLIC_VAULT_BASE ?? 'http://localhost:4003';

function authHeaders(accessToken: string) {
  return {
    'content-type': 'application/json',
    authorization: `Bearer ${accessToken}`,
  };
}

async function crypto() {
  const c = await import('@aegis/crypto');
  await c.initCrypto();
  return c;
}

export async function listVaultItems(
  accessToken: string,
  encryptionKeyB64: string,
): Promise<DecryptedVaultItem[]> {
  const c = await crypto();
  const key = c.fromBase64(encryptionKeyB64);

  const res = await fetch(`${VAULT_BASE}/vault/items`, {
    headers: authHeaders(accessToken),
  });
  if (!res.ok) throw new Error('Could not load your vault.');
  const rows = (await res.json()) as VaultItemCipher[];

  return rows.map((row) => ({
    ...row,
    data: c.decrypt<CredentialSecret>(key, {
      ct: row.ciphertext,
      nonce: row.nonce,
    }),
  }));
}

export async function saveVaultItem(
  accessToken: string,
  encryptionKeyB64: string,
  type: VaultItemType,
  data: CredentialSecret,
): Promise<VaultItemCipher> {
  const c = await crypto();
  const key = c.fromBase64(encryptionKeyB64);

  // The whole item (incl. metadata) is encrypted client-side. Each item gets a
  // unique random nonce from the AEAD; the server only ever sees the ciphertext.
  const box = c.encrypt(key, data);

  const res = await fetch(`${VAULT_BASE}/vault/items`, {
    method: 'POST',
    headers: authHeaders(accessToken),
    body: JSON.stringify({ type, ciphertext: box.ct, nonce: box.nonce }),
  });
  if (!res.ok) throw new Error('Could not save the item.');
  return (await res.json()) as VaultItemCipher;
}

export async function deleteVaultItem(
  accessToken: string,
  id: string,
): Promise<void> {
  const res = await fetch(`${VAULT_BASE}/vault/items/${id}`, {
    method: 'DELETE',
    headers: authHeaders(accessToken),
  });
  if (!res.ok) throw new Error('Could not delete the item.');
}
