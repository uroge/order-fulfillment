import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProxyService } from '../common/proxy.service';
import { ConfigService } from '@nestjs/config';
import {
  CancelOrderDto,
  CreateOrderDto,
  OrderResponseDto,
} from '@order-fulfillment/shared';
import { AuthUser } from '@order-fulfillment/shared';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('orders')
export class OrdersController {
  private readonly ordersServiceUrl: URL;
  private readonly ordersServiceAudience: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly proxyService: ProxyService
  ) {
    const rawUrl = this.configService.get<string>('ORDERS_SERVICE_URL');
    if (!rawUrl) {
      throw new Error('ORDERS_SERVICE_URL is required');
    }
    try {
      this.ordersServiceUrl = new URL(rawUrl);
    } catch {
      throw new Error(`ORDERS_SERVICE_URL is invalid: ${rawUrl}`);
    }
    this.ordersServiceAudience =
      this.configService.get<string>('ORDERS_SERVICE_AUDIENCE') ||
      this.configService.get<string>('SERVICE_TOKEN_AUDIENCE');
    if (!this.ordersServiceAudience) {
      throw new Error('ORDERS_SERVICE_AUDIENCE is required');
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async createOrder(
    @Body() dto: CreateOrderDto,
    @CurrentUser() user: AuthUser | undefined
  ) {
    const userId = user?.userId;
    if (!userId) {
      throw new BadRequestException('User context missing');
    }

    const response = await this.proxyService.forward<OrderResponseDto>({
      baseUrl: this.ordersServiceUrl,
      audience: this.ordersServiceAudience,
      method: 'POST',
      path: '/orders',
      body: dto,
      headers: {
        'x-user-id': userId,
      },
    });

    if (response.status >= 400) {
      throw new HttpException(response.data, response.status);
    }
    return this.toOrderResponse(response.data);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async getOrders(
    @CurrentUser() user: AuthUser | undefined
  ) {
    const userId = user?.userId;
    if (!userId) {
      throw new BadRequestException('User context missing');
    }
    const response = await this.proxyService.forward<OrderResponseDto[]>({
      baseUrl: this.ordersServiceUrl,
      audience: this.ordersServiceAudience,
      method: 'GET',
      path: '/orders',
      headers: {
        'x-user-id': userId,
      },
    });

    if (response.status >= 400) {
      throw new HttpException(response.data, response.status);
    }
    return this.toOrderResponseList(response.data);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async getOrder(
    @Param('id') orderId: string,
    @CurrentUser() user: AuthUser | undefined
  ) {
    const userId = user?.userId;
    if (!userId) {
      throw new BadRequestException('User context missing');
    }
    const response = await this.proxyService.forward<OrderResponseDto>({
      baseUrl: this.ordersServiceUrl,
      audience: this.ordersServiceAudience,
      method: 'GET',
      path: `/orders/${orderId}`,
      headers: {
        'x-user-id': userId,
      },
    });

    if (response.status >= 400) {
      throw new HttpException(response.data, response.status);
    }
    return this.toOrderResponse(response.data);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/cancel')
  async cancelOrder(
    @Param('id') orderId: string,
    @Body() dto: CancelOrderDto,
    @CurrentUser() user: AuthUser | undefined
  ) {
    const userId = user?.userId;
    if (!userId) {
      throw new BadRequestException('User context missing');
    }
    const response = await this.proxyService.forward<OrderResponseDto>({
      baseUrl: this.ordersServiceUrl,
      audience: this.ordersServiceAudience,
      method: 'POST',
      path: `/orders/${orderId}/cancel`,
      body: dto,
      headers: {
        'x-user-id': userId,
      },
    });

    if (response.status >= 400) {
      throw new HttpException(response.data, response.status);
    }
    return this.toOrderResponse(response.data);
  }

  private toOrderResponse(data: OrderResponseDto): OrderResponseDto {
    return {
      id: data.id,
      userId: data.userId,
      status: data.status,
      currency: data.currency,
      total: data.total,
      items: data.items ?? [],
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      cancelReason: data.cancelReason ?? null,
      cancelledAt: data.cancelledAt ?? null,
    };
  }

  private toOrderResponseList(data: OrderResponseDto[]): OrderResponseDto[] {
    return Array.isArray(data) ? data.map((order) => this.toOrderResponse(order)) : [];
  }
}
