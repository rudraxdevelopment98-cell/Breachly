/**
 * Shared types for the breach check flow.
 * The shape mirrors the cleaned-up JSON returned by the `check-breach`
 * Edge Function (a subset of HIBP's breach model — see CLAUDE.md §6).
 */

export interface Breach {
  /** Stable HIBP name, e.g. "Adobe". Used as a key. */
  name: string;
  /** Human-friendly title, e.g. "Adobe". */
  title: string;
  /** Domain the breach is associated with, e.g. "adobe.com". */
  domain: string;
  /** Year the breach occurred (derived from BreachDate). */
  year: number | null;
  /** Full ISO breach date if available. */
  breachDate: string | null;
  /** Plain list of what leaked, e.g. ["Email addresses", "Passwords"]. */
  dataClasses: string[];
  /** HIBP description (HTML stripped to plain text server-side). */
  description: string;
  /** HIBP severity hints. */
  isSensitive: boolean;
  isVerified: boolean;
  /** Logo URL if HIBP provides one. */
  logoPath: string | null;
}

export interface CheckResult {
  email: string;
  breached: boolean;
  breaches: Breach[];
  /** Whether any password data was exposed across the breaches. */
  passwordExposed: boolean;
  checkedAt: string;
}
