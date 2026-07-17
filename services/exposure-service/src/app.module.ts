import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuditModule } from './audit/audit.module';
import { ExposureModule } from './exposure/exposure.module';

@Module({
  imports: [PrismaModule, AuditModule, ExposureModule],
})
export class AppModule {}
