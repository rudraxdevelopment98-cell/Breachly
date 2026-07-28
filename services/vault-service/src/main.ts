import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.enableCors();
  const port = Number(process.env.PORT ?? process.env.VAULT_SERVICE_PORT ?? 4003);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`vault-service listening on :${port}`);
}

void bootstrap();
