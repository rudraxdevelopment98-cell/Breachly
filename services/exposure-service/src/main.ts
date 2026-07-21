import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.enableCors();
  // Hosts (Render/Railway/Fly) inject PORT; fall back to the service default.
  const port = Number(process.env.PORT ?? process.env.EXPOSURE_SERVICE_PORT ?? 4002);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`exposure-service listening on :${port}`);
}

void bootstrap();
