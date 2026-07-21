import { HttpException, Injectable } from '@nestjs/common';
import type { BreachRecord } from '@aegis/types';

/**
 * HaveIBeenPwned client (aegis §9). The API key is read from the server
 * environment ONLY — it is never sent to any client. Ported from the original
 * Breachly Supabase Edge Function so the logic carries forward unchanged.
 */
const HIBP_BASE = 'https://haveibeenpwned.com/api/v3';
const USER_AGENT = 'aegis-exposure-service';
const PASSWORD_CLASSES = ['Passwords', 'Password hints'];

interface HibpBreach {
  Name: string;
  Title: string;
  Domain: string;
  BreachDate: string;
  Description: string;
  DataClasses: string[];
}

type CleanBreach = Omit<BreachRecord, 'id' | 'discoveredAt'>;

@Injectable()
export class HibpService {
  private readonly apiKey = process.env.HIBP_API_KEY ?? '';

  get configured(): boolean {
    return this.apiKey.length > 0;
  }

  /** Returns the breaches for an email, or [] if none (HIBP 404). */
  async breachedAccount(email: string): Promise<CleanBreach[]> {
    // Dev / free path: with no paid HIBP key, serve realistic sample data so
    // the whole stack (web + mobile) works end-to-end at zero cost. Flips to
    // live HIBP automatically once HIBP_API_KEY is set. Emails containing
    // "clear" return no breaches so the all-clear state is testable.
    if (!this.configured) {
      if (email.includes('clear')) return [];
      return SAMPLE_BREACHES;
    }

    const url =
      `${HIBP_BASE}/breachedaccount/${encodeURIComponent(email)}` +
      `?truncateResponse=false`;

    let res: Response;
    try {
      res = await fetch(url, {
        headers: { 'hibp-api-key': this.apiKey, 'user-agent': USER_AGENT },
      });
    } catch {
      throw new HttpException('Upstream request failed', 502);
    }

    if (res.status === 404) return [];
    if (res.status === 429) throw new HttpException('Rate limited', 429);
    if (!res.ok) throw new HttpException('Lookup failed', 502);

    const raw = (await res.json()) as HibpBreach[];
    return (raw ?? []).map((b) => {
      const year = b.BreachDate ? Number(b.BreachDate.slice(0, 4)) : null;
      const exposedFields = Array.isArray(b.DataClasses) ? b.DataClasses : [];
      return {
        source: 'hibp',
        breachName: b.Name,
        title: b.Title || b.Name,
        domain: b.Domain ?? '',
        year: Number.isFinite(year) ? year : null,
        breachDate: b.BreachDate ?? null,
        exposedFields,
        description: stripHtml(b.Description ?? ''),
        passwordExposed: exposedFields.some((c) => PASSWORD_CLASSES.includes(c)),
      };
    });
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

// Sample data used only when HIBP_API_KEY is absent (dev / free path).
const SAMPLE_BREACHES: CleanBreach[] = [
  {
    source: 'sample',
    breachName: 'Adobe',
    title: 'Adobe',
    domain: 'adobe.com',
    year: 2013,
    breachDate: '2013-10-04',
    exposedFields: ['Email addresses', 'Password hints', 'Passwords', 'Usernames'],
    description:
      'In October 2013, 153 million Adobe accounts were breached, exposing emails, encrypted passwords and password hints.',
    passwordExposed: true,
  },
  {
    source: 'sample',
    breachName: 'LinkedIn',
    title: 'LinkedIn',
    domain: 'linkedin.com',
    year: 2012,
    breachDate: '2012-05-05',
    exposedFields: ['Email addresses', 'Passwords'],
    description:
      'In 2012, LinkedIn was breached and 164 million accounts were exposed, including emails and SHA-1 hashed passwords.',
    passwordExposed: true,
  },
];
