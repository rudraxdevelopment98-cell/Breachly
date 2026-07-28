import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard, type AuthedRequest } from '../auth/jwt-auth.guard';
import { VaultService } from './vault.service';
import { UpsertVaultItemDto } from './dto';

function ip(req: AuthedRequest): string | null {
  return (
    (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ??
    req.socket.remoteAddress ??
    null
  );
}

@Controller('vault/items')
@UseGuards(JwtAuthGuard)
export class VaultController {
  constructor(private readonly vault: VaultService) {}

  @Get()
  list(@Req() req: AuthedRequest) {
    return this.vault.list(req.userId!, ip(req));
  }

  @Post()
  create(@Req() req: AuthedRequest, @Body() dto: UpsertVaultItemDto) {
    return this.vault.create(req.userId!, dto, ip(req));
  }

  @Put(':id')
  update(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Body() dto: UpsertVaultItemDto,
  ) {
    return this.vault.update(req.userId!, id, dto, ip(req));
  }

  @Delete(':id')
  async remove(@Req() req: AuthedRequest, @Param('id') id: string) {
    await this.vault.remove(req.userId!, id, ip(req));
    return { ok: true };
  }
}
