import { Body, Controller, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import type { BreachCheckResponse, BrokerListing } from '@aegis/types';
import { ExposureService } from './exposure.service';
import { CheckBreachDto } from './dto';

function clientIp(req: Request): string | null {
  return (
    (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ??
    req.socket.remoteAddress ??
    null
  );
}

@Controller('exposure')
export class ExposureController {
  constructor(private readonly exposure: ExposureService) {}

  @Post('breach-check')
  checkBreaches(
    @Body() dto: CheckBreachDto,
    @Req() req: Request,
  ): Promise<BreachCheckResponse> {
    return this.exposure.checkBreaches(
      dto.userId ?? 'anonymous',
      dto.email,
      clientIp(req),
    );
  }

  @Post('broker-scan')
  scanBrokers(
    @Query('userId') userId: string,
    @Req() req: Request,
  ): Promise<BrokerListing[]> {
    return this.exposure.scanBrokers(userId ?? 'anonymous', clientIp(req));
  }
}
