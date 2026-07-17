/** family-service contracts + age-banded permission model (aegis §7). */

export type AgeTier = 'under13' | 'teen13_17' | 'adult';

export type PermissionTier =
  | 'full_guardian_visibility' // under-13 default
  | 'shared_visibility_metadata_plus_alerts' // teen default (the floor)
  | 'no_guardian_access'; // adult default

export interface GuardianPermissions {
  canViewContent: boolean;
  canViewMetadataOnly: boolean;
  receivesAlerts: boolean;
}

/**
 * Age-banded defaults — principle #4. NOT a single blanket toggle.
 * The teen tier is a FLOOR: a guardian may configure within a bounded set but
 * can never drop below metadata+alerts, nor force full-access-always.
 */
export const AGE_TIER_DEFAULTS: Record<
  AgeTier,
  { permissionTier: PermissionTier; guardian: GuardianPermissions }
> = {
  under13: {
    permissionTier: 'full_guardian_visibility',
    guardian: { canViewContent: true, canViewMetadataOnly: true, receivesAlerts: true },
  },
  teen13_17: {
    permissionTier: 'shared_visibility_metadata_plus_alerts',
    guardian: { canViewContent: false, canViewMetadataOnly: true, receivesAlerts: true },
  },
  adult: {
    permissionTier: 'no_guardian_access',
    guardian: { canViewContent: false, canViewMetadataOnly: false, receivesAlerts: false },
  },
};

export interface FamilyMember {
  familySpaceId: string;
  userId: string;
  relationship: string;
  ageTier: AgeTier;
  permissionTier: PermissionTier;
  guardian: GuardianPermissions;
}
