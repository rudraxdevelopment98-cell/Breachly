import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma';

/**
 * Prisma client for exposure-service's own database.
 *
 * DB-optional in dev: if EXPOSURE_DATABASE_URL is not set, the service still
 * boots (audit falls back to the console sink; Phase 1 breach/broker endpoints
 * don't require the DB), so the whole stack runs with zero infra at zero cost.
 * Set EXPOSURE_DATABASE_URL (e.g. via docker-compose Postgres) to persist.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      datasources: {
        db: {
          // Placeholder keeps the client constructor happy when running DB-less;
          // we simply never connect in that case.
          url:
            process.env.EXPOSURE_DATABASE_URL ??
            'postgresql://localhost:5432/aegis_exposure_unset',
        },
      },
    });
  }

  static get enabled(): boolean {
    return Boolean(process.env.EXPOSURE_DATABASE_URL);
  }

  async onModuleInit(): Promise<void> {
    if (!PrismaService.enabled) {
      this.logger.warn(
        'EXPOSURE_DATABASE_URL not set — running without persistence (dev mode).',
      );
      return;
    }
    await this.$connect();
  }
}
