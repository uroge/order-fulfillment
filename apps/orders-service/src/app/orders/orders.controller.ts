import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CancelOrderDto, CreateOrderDto } from '@order-fulfillment/shared';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('service'))
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get(':id')
  getOrder(
    @Param('id') orderId: string,
    @Headers('x-user-id') userId: string | undefined
  ) {
    if (!userId) {
      throw new BadRequestException('x-user-id header is required');
    }
    return this.ordersService.getOrder(orderId, userId);
  }

  @Get()
  getOrders(@Headers('x-user-id') userId: string | undefined) {
    if (!userId) {
      throw new BadRequestException('x-user-id header is required');
    }
    return this.ordersService.getOrdersForUser(userId);
  }

  @Post()
  createOrder(
    @Body() orderDto: CreateOrderDto,
    @Headers('x-user-id') userId: string | undefined
  ) {
    if (!userId) {
      throw new BadRequestException('x-user-id header is required');
    }
    return this.ordersService.createOrder(userId, orderDto);
  }

  @Post(':id/cancel')
  cancelOrder(
    @Body() cancelOrderDto: CancelOrderDto,
    @Param('id') orderId: string,
    @Headers('x-user-id') userId: string | undefined
  ) {
    if (!userId) {
      throw new BadRequestException('x-user-id header is required');
    }
    return this.ordersService.cancelOrder(orderId, userId, cancelOrderDto);
  }
}
