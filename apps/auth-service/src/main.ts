import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { ConfigService } from '@nestjs/config';
import { JsonLoggerService } from '@order-fulfillment/shared';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = app.get(JsonLoggerService);
  app.useLogger(logger);
  const globalPrefix = 'auth';
  app.setGlobalPrefix(globalPrefix);
  const config = app.get(ConfigService);
  const port = config.get<number>('PORT') || 3001;
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );
}

bootstrap();
