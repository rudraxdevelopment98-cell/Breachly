/** auth-service contracts (aegis §4, §6). */

export interface SignupRequest {
  email: string;
  /** base64 auth_key derived client-side via Argon2id — NOT the password. */
  authKey: string;
  /** Argon2id salt (base64) the client used, stored for future logins. */
  salt: string;
  /** User's X25519 public key (base64) for document-share wrapping. */
  publicKey: string;
}

export interface LoginRequest {
  email: string;
  /** base64 auth_key derived client-side. The server never sees the password. */
  authKey: string;
  /** TOTP code when MFA is enabled. */
  totp?: string;
}

export interface SaltResponse {
  /** Per-user Argon2id salt so the client can derive keys before login. */
  salt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  /** Access-token expiry, unix seconds. */
  accessExpiresAt: number;
}

export interface SessionUser {
  id: string;
  email: string;
  mfaEnabled: boolean;
  publicKey: string;
}

export type MfaMethod = 'totp' | 'webauthn';
