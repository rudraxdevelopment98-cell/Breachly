import { Injectable, type OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma';

/**
 * Prisma client for auth-service's own database. Run `npm run prisma:generate`
 * to produce the typed client under src/generated/prisma before building.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }
}
