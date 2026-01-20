import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { TestController } from '../test/test.controller';
import {
  CorrelationIdMiddleware,
  CorrelationIdService,
} from '@order-fulfillment/shared';

// TODO:
// [] Corellation ids implementation
// [] Rate limiting
// [] Docker
// [] Logging
// [] Monitoring

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.api-gateway'],
    }),
    AuthModule,
  ],
  controllers: [AppController, TestController],
  providers: [AppService, CorrelationIdService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
