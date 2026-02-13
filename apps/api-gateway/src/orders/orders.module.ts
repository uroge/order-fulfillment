import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { AuthModule } from '../auth/auth.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [AuthModule, CommonModule],
  controllers: [OrdersController],
})
export class OrdersModule {}
