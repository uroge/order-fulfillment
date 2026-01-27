import { Module } from '@nestjs/common';
import { ServiceJwtStrategy } from '@order-fulfillment/shared';

@Module({
  providers: [ServiceJwtStrategy],
})
export class AuthModule {}
