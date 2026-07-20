import type { BreachCheckResponse, BreachRecord } from '@aegis/types';
import type { Breach, CheckResult } from '@/types';
import { getMockResult } from './mockBreaches';

/**
 * Mobile breach-check client.
 *
 * Talks to the SAME backend contract as the web app: the aegis
 * `exposure-service` (`POST /exposure/breach-check`), which holds the HIBP
 * secret key server-side (CLAUDE.md §9). The app never holds the key.
 *
 * In mock mode (EXPO_PUBLIC_USE_MOCK !== 'false') it returns local sample data
 * so it runs on a device/simulator with no backend.
 */

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK !== 'false';
const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE ?? 'http://localhost:4002';

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

/** Map the shared BreachRecord (exposure-service) → the app's display shape. */
function toBreach(r: BreachRecord): Breach {
  return {
    name: r.breachName,
    title: r.title,
    domain: r.domain,
    year: r.year,
    breachDate: r.breachDate,
    dataClasses: r.exposedFields,
    description: r.description,
    isSensitive: false,
    isVerified: true,
    logoPath: null,
  };
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

  const endpoint = `${API_BASE.replace(/\/$/, '')}/exposure/breach-check`;

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    throw new CheckBreachError('The check failed. Please try again in a moment.');
  }

  const data = (await res.json()) as BreachCheckResponse;
  const breaches = Array.isArray(data.breaches) ? data.breaches.map(toBreach) : [];

  return {
    email,
    breached: Boolean(data.breached),
    breaches,
    passwordExposed:
      data.passwordExposed ??
      breaches.some((b) =>
        b.dataClasses.some((c) => c.toLowerCase().includes('password')),
      ),
    checkedAt: new Date().toISOString(),
  };
}
