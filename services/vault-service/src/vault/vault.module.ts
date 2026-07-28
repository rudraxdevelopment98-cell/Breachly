import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { VaultController } from './vault.controller';
import { VaultService } from './vault.service';
import { VaultRepository } from './vault.repository';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Module({
  imports: [JwtModule.register({})],
  controllers: [VaultController],
  providers: [VaultService, VaultRepository, JwtAuthGuard],
})
export class VaultModule {}
