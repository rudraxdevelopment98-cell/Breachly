import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma';

/**
 * DB-optional like the other services: without VAULT_DATABASE_URL the vault runs
 * on an in-memory store (dev), so the whole app boots with zero infra. Set the
 * URL to persist ciphertext in Postgres.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      datasources: {
        db: {
          url:
            process.env.VAULT_DATABASE_URL ??
            'postgresql://localhost:5432/aegis_vault_unset',
        },
      },
    });
  }

  static get enabled(): boolean {
    return Boolean(process.env.VAULT_DATABASE_URL);
  }

  async onModuleInit(): Promise<void> {
    if (!PrismaService.enabled) {
      this.logger.warn(
        'VAULT_DATABASE_URL not set — using in-memory vault store (dev mode).',
      );
      return;
    }
    await this.$connect();
  }
}
