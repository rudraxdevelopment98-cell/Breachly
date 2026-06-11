import type { Breach, CheckResult } from '@/types';
import { getMockResult } from './mockBreaches';

/**
 * Client for the breach check.
 *
 * In mock mode (EXPO_PUBLIC_USE_MOCK !== 'false') it returns local sample
 * data so the app runs with no backend. Otherwise it calls the Supabase
 * `check-breach` Edge Function, which holds the HIBP secret key server-side
 * (see CLAUDE.md §6). The app NEVER talks to HIBP directly and NEVER holds
 * the key.
 */

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK !== 'false';
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

export class CheckBreachError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CheckBreachError';
  }
}

export async function checkBreach(emailRaw: string): Promise<CheckResult> {
  const email = emailRaw.trim().toLowerCase();

  if (!isValidEmail(email)) {
    throw new CheckBreachError('Enter a valid email address.');
  }

  if (USE_MOCK) {
    // Small delay so loading states are visible during development.
    await new Promise((r) => setTimeout(r, 600));
    try {
      return getMockResult(email);
    } catch (e) {
      throw new CheckBreachError(
        e instanceof Error ? e.message : 'Something went wrong.',
      );
    }
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new CheckBreachError(
      'Backend not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY, or use mock mode.',
    );
  }

  const endpoint = `${SUPABASE_URL.replace(/\/$/, '')}/functions/v1/check-breach`;

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ email }),
    });
  } catch {
    throw new CheckBreachError(
      'Could not reach the server. Check your connection and try again.',
    );
  }

  if (res.status === 429) {
    throw new CheckBreachError('Too many checks. Wait a moment and try again.');
  }

  if (!res.ok) {
    throw new CheckBreachError(
      'The check failed. Please try again in a moment.',
    );
  }

  const data = (await res.json()) as {
    breached: boolean;
    breaches: Breach[];
    passwordExposed?: boolean;
  };

  const breaches = Array.isArray(data.breaches) ? data.breaches : [];

  return {
    email,
    breached: Boolean(data.breached),
    breaches,
    passwordExposed:
      data.passwordExposed ??
      breaches.some((b) =>
        b.dataClasses?.some((c) => c.toLowerCase().includes('password')),
      ),
    checkedAt: new Date().toISOString(),
  };
}
