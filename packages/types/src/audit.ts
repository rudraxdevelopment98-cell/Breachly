/** Audit-log contract shared by every service (aegis §2 principle #3, §6). */

export type AuditAction =
  // auth
  | 'user.signup'
  | 'user.login'
  | 'user.login_failed'
  | 'session.refresh'
  | 'session.revoked'
  | 'mfa.enrolled'
  // exposure
  | 'breach.checked'
  | 'broker.scanned'
  | 'optout.requested'
  | 'optout.confirmed'
  // vault (later phases)
  | 'vault.item_read'
  | 'vault.item_written'
  | 'document.downloaded'
  | 'share.granted'
  | 'share.revoked'
  // family
  | 'family.member_added'
  | 'family.permission_changed';

export type AuditTargetType =
  | 'user'
  | 'session'
  | 'breach_record'
  | 'broker_listing'
  | 'vault_item'
  | 'document'
  | 'share_grant'
  | 'family_member';

export interface AuditEvent {
  actorId: string | null;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: string | null;
  ip: string | null;
  /** Non-sensitive structured context. NEVER put plaintext secrets here. */
  metadata?: Record<string, string | number | boolean | null>;
  timestamp: string; // ISO
}
