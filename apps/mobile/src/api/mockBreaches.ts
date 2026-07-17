import type { Breach, CheckResult } from '@/types';

/**
 * Local mock data used when EXPO_PUBLIC_USE_MOCK=true (the default), so the
 * app runs end-to-end with zero backend. Swap to the live Edge Function by
 * setting EXPO_PUBLIC_USE_MOCK=false and configuring Supabase + HIBP.
 *
 * Convention for demos/tests:
 *   - any email containing "clear"  -> no breaches
 *   - any email containing "error"  -> throws (to exercise the error state)
 *   - anything else                 -> the sample breached result below
 */

const SAMPLE_BREACHES: Breach[] = [
  {
    name: 'Adobe',
    title: 'Adobe',
    domain: 'adobe.com',
    year: 2013,
    breachDate: '2013-10-04',
    dataClasses: ['Email addresses', 'Password hints', 'Passwords', 'Usernames'],
    description:
      'In October 2013, 153 million Adobe accounts were breached, exposing emails, encrypted passwords and password hints.',
    isSensitive: false,
    isVerified: true,
    logoPath: null,
  },
  {
    name: 'LinkedIn',
    title: 'LinkedIn',
    domain: 'linkedin.com',
    year: 2012,
    breachDate: '2012-05-05',
    dataClasses: ['Email addresses', 'Passwords'],
    description:
      'In 2012, LinkedIn was breached and 164 million accounts were exposed, including emails and SHA-1 hashed passwords.',
    isSensitive: false,
    isVerified: true,
    logoPath: null,
  },
  {
    name: 'Canva',
    title: 'Canva',
    domain: 'canva.com',
    year: 2019,
    breachDate: '2019-05-24',
    dataClasses: ['Email addresses', 'Geographic locations', 'Names', 'Passwords', 'Usernames'],
    description:
      'In May 2019, the design tool Canva suffered a breach affecting 137 million users, exposing names, emails and bcrypt-hashed passwords.',
    isSensitive: false,
    isVerified: true,
    logoPath: null,
  },
];

const PASSWORD_CLASSES = ['Passwords', 'Password hints'];

function passwordExposed(breaches: Breach[]): boolean {
  return breaches.some((b) =>
    b.dataClasses.some((c) => PASSWORD_CLASSES.includes(c)),
  );
}

export function getMockResult(email: string): CheckResult {
  const normalized = email.trim().toLowerCase();

  if (normalized.includes('error')) {
    throw new Error('Mock error: simulated lookup failure.');
  }

  const breaches = normalized.includes('clear') ? [] : SAMPLE_BREACHES;

  return {
    email: normalized,
    breached: breaches.length > 0,
    breaches,
    passwordExposed: passwordExposed(breaches),
    checkedAt: new Date().toISOString(),
  };
}
