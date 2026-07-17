import { Inject, Injectable } from '@nestjs/common';
import { AuditLogger } from '@aegis/audit';
import type {
  BreachCheckResponse,
  BrokerListing,
  RegistryAdapter,
} from '@aegis/types';
import { HibpService } from '../hibp/hibp.service';
import { CURATED_BROKERS } from '../brokers/broker-registry';
import { CaliforniaDropAdapter } from '../brokers/adapters/ca-drop.adapter';
import { AUDIT_LOGGER } from '../audit/audit.module';

@Injectable()
export class ExposureService {
  /** Registry adapters, tried in order; per-site opt-out is the fallback. */
  private readonly adapters: RegistryAdapter[] = [new CaliforniaDropAdapter()];

  constructor(
    private readonly hibp: HibpService,
    @Inject(AUDIT_LOGGER) private readonly audit: AuditLogger,
  ) {}

  async checkBreaches(
    userId: string,
    email: string,
    ip: string | null,
  ): Promise<BreachCheckResponse> {
    const found = await this.hibp.breachedAccount(email);
    const checkedAt = new Date().toISOString();

    await this.audit.emit({
      actorId: userId,
      action: 'breach.checked',
      targetType: 'user',
      targetId: userId,
      ip,
      metadata: { breachCount: found.length },
    });

    return {
      email,
      breached: found.length > 0,
      passwordExposed: found.some((b) => b.passwordExposed),
      breaches: found.map((b, i) => ({
        id: `${b.source}:${b.breachName}:${i}`,
        discoveredAt: checkedAt,
        ...b,
      })),
      checkedAt,
    };
  }

  /**
   * Scan the curated broker list for a user. In Phase 1 this returns the target
   * set with status "found"; live scraping/checking lands in Phase 2's job queue.
   */
  async scanBrokers(userId: string, ip: string | null): Promise<BrokerListing[]> {
    await this.audit.emit({
      actorId: userId,
      action: 'broker.scanned',
      targetType: 'user',
      targetId: userId,
      ip,
      metadata: { targets: CURATED_BROKERS.length },
    });

    const now = new Date().toISOString();
    return CURATED_BROKERS.map((b, i) => ({
      id: `broker:${b.domain}:${i}`,
      brokerName: b.name,
      brokerDomain: b.domain,
      registry: b.registry,
      status: 'found' as const,
      lastCheckedAt: now,
    }));
  }

  /** Which registry (if any) can action a deletion for a broker domain. */
  registryFor(brokerDomain: string): RegistryAdapter | null {
    return this.adapters.find((a) => a.covers(brokerDomain)) ?? null;
  }
}
