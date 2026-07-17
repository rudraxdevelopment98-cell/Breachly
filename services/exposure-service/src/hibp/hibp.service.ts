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

@Injectable()
export class HibpService {
  private readonly apiKey = process.env.HIBP_API_KEY ?? '';

  get configured(): boolean {
    return this.apiKey.length > 0;
  }

  /** Returns the breaches for an email, or [] if none (HIBP 404). */
  async breachedAccount(email: string): Promise<
    Omit<BreachRecord, 'id' | 'discoveredAt'>[]
  > {
    if (!this.configured) {
      throw new HttpException('HIBP not configured', 503);
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
