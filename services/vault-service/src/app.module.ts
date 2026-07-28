import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuditModule } from './audit/audit.module';
import { VaultModule } from './vault/vault.module';

@Module({
  imports: [PrismaModule, AuditModule, VaultModule],
})
export class AppModule {}
