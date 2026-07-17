import { Module } from '@nestjs/common';
import { HibpService } from '../hibp/hibp.service';
import { ExposureController } from './exposure.controller';
import { ExposureService } from './exposure.service';

@Module({
  controllers: [ExposureController],
  providers: [ExposureService, HibpService],
})
export class ExposureModule {}
