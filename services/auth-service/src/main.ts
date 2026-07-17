import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );
  app.enableCors();
  const port = Number(process.env.AUTH_SERVICE_PORT ?? 4001);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`auth-service listening on :${port}`);
}

void bootstrap();
