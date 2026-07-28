/** vault-service contracts (aegis §5, §6). Server sees only the cipher shape. */

export type VaultItemType = 'password' | 'note' | 'card';

/** What the server stores/returns — ciphertext only, never plaintext. */
export interface VaultItemCipher {
  id: string;
  type: VaultItemType;
  ciphertext: string;
  nonce: string;
  createdAt: string;
  updatedAt: string;
}

/** The decrypted contents — exists ONLY on the client, never sent as-is. */
export interface CredentialSecret {
  title: string; // metadata — encrypted with the same rigor as the secret
  url?: string;
  username?: string;
  password: string;
  notes?: string;
}

/** A decrypted item = server cipher metadata + client-decrypted contents. */
export interface DecryptedVaultItem extends VaultItemCipher {
  data: CredentialSecret;
}
