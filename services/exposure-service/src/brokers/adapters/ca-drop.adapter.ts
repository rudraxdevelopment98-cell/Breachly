import type { OptOutStatus, RegistryAdapter } from '@aegis/types';
import { CURATED_BROKERS } from '../broker-registry';

/**
 * California DROP (Delete Request & Opt-Out Platform) adapter — aegis §9.
 *
 * DROP lets a consumer request deletion across ALL CA-registered brokers with a
 * single request (Delete Act; brokers must action from Aug 1 2026). This one
 * adapter therefore replaces dozens of fragile per-site scrapers for CA users.
 *
 * The public API/sandbox opens in 2026 — until CA_DROP_API_BASE + CA_DROP_API_KEY
 * are provisioned, `submitOptOut` throws so callers fall back to per-site opt-out.
 * This is the reference implementation of the pluggable registry-adapter pattern:
 * equivalent state/country platforms drop in by implementing RegistryAdapter.
 */
export class CaliforniaDropAdapter implements RegistryAdapter {
  key = 'ca_drop';
  displayName = 'California DROP';

  private readonly base = process.env.CA_DROP_API_BASE ?? '';
  private readonly apiKey = process.env.CA_DROP_API_KEY ?? '';

  private readonly coveredDomains = new Set(
    CURATED_BROKERS.filter((b) => b.registry === 'ca_drop').map((b) => b.domain),
  );

  get configured(): boolean {
    return this.base.length > 0 && this.apiKey.length > 0;
  }

  covers(brokerDomain: string): boolean {
    return this.coveredDomains.has(brokerDomain);
  }

  async submitOptOut(input: {
    listingId: string;
    subject: { email: string };
  }): Promise<{ confirmationRef: string; status: OptOutStatus }> {
    if (!this.configured) {
      throw new Error(
        'CA DROP API not provisioned yet (sandbox opens 2026). Falling back to per-site opt-out.',
      );
    }
    // Reference shape for when the sandbox is available:
    const res = await fetch(`${this.base}/v1/delete-requests`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${this.apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ email: input.subject.email }),
    });
    if (!res.ok) throw new Error(`DROP submit failed: ${res.status}`);
    const data = (await res.json()) as { requestId: string };
    return { confirmationRef: data.requestId, status: 'submitted' };
  }
}
