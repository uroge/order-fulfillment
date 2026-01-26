import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { ConfigService } from '@nestjs/config';
import {
  HttpExceptionFilter,
  JsonLoggerService,
} from '@order-fulfillment/shared';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = app.get(JsonLoggerService);
  app.useLogger(logger);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  const config = app.get(ConfigService);
  const port = config.get<number>('PORT') || 3002;
  await app.listen(port);
  Logger.log(`🚀 Application is running on: http://localhost:${port}`);
}

bootstrap();
