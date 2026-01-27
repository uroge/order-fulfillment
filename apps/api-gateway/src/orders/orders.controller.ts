import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { CORRELATION_ID_HEADER } from '@order-fulfillment/shared';
import { CancelOrderDto, CreateOrderDto } from '@order-fulfillment/shared';
import { OrdersService } from './orders.service';
import { AuthUser } from '@order-fulfillment/shared';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('orders')
export class OrdersController {
  private readonly ordersServiceUrl: URL;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly ordersService: OrdersService
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
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async createOrder(
    @Body() dto: CreateOrderDto,
    @Headers(CORRELATION_ID_HEADER) correlationId: string | undefined,
    @CurrentUser() user: AuthUser | undefined
  ) {
    const userId = user?.userId;
    if (!userId) {
      throw new BadRequestException('User context missing');
    }

    const serviceToken = await this.ordersService.createServiceToken();
    const response = await firstValueFrom(
      this.httpService.post(
        `${this.ordersServiceUrl.toString().replace(/\/$/, '')}/orders`,
        dto,
        {
          headers: {
            Authorization: `Bearer ${serviceToken}`,
            'x-user-id': userId,
            ...(correlationId
              ? { [CORRELATION_ID_HEADER]: correlationId }
              : {}),
          },
          validateStatus: () => true,
        }
      )
    );

    if (response.status >= 400) {
      throw new HttpException(response.data, response.status);
    }
    return response.data;
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async getOrders(
    @Headers(CORRELATION_ID_HEADER) correlationId: string | undefined,
    @CurrentUser() user: AuthUser | undefined
  ) {
    const userId = user?.userId;
    if (!userId) {
      throw new BadRequestException('User context missing');
    }
    const serviceToken = await this.ordersService.createServiceToken();
    const response = await firstValueFrom(
      this.httpService.get(
        `${this.ordersServiceUrl.toString().replace(/\/$/, '')}/orders`,
        {
          headers: {
            Authorization: `Bearer ${serviceToken}`,
            'x-user-id': userId,
            ...(correlationId
              ? { [CORRELATION_ID_HEADER]: correlationId }
              : {}),
          },
          validateStatus: () => true,
        }
      )
    );

    if (response.status >= 400) {
      throw new HttpException(response.data, response.status);
    }
    return response.data;
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async getOrder(
    @Param('id') orderId: string,
    @Headers(CORRELATION_ID_HEADER) correlationId: string | undefined,
    @CurrentUser() user: AuthUser | undefined
  ) {
    const userId = user?.userId;
    if (!userId) {
      throw new BadRequestException('User context missing');
    }
    const serviceToken = await this.ordersService.createServiceToken();
    const response = await firstValueFrom(
      this.httpService.get(
        `${this.ordersServiceUrl.toString().replace(/\/$/, '')}/orders/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${serviceToken}`,
            'x-user-id': userId,
            ...(correlationId
              ? { [CORRELATION_ID_HEADER]: correlationId }
              : {}),
          },
          validateStatus: () => true,
        }
      )
    );

    if (response.status >= 400) {
      throw new HttpException(response.data, response.status);
    }
    return response.data;
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/cancel')
  async cancelOrder(
    @Param('id') orderId: string,
    @Body() dto: CancelOrderDto,
    @Headers(CORRELATION_ID_HEADER) correlationId: string | undefined,
    @CurrentUser() user: AuthUser | undefined
  ) {
    const userId = user?.userId;
    if (!userId) {
      throw new BadRequestException('User context missing');
    }
    const serviceToken = await this.ordersService.createServiceToken();
    const response = await firstValueFrom(
      this.httpService.post(
        `${this.ordersServiceUrl.toString().replace(/\/$/, '')}/orders/${orderId}/cancel`,
        dto,
        {
          headers: {
            Authorization: `Bearer ${serviceToken}`,
            'x-user-id': userId,
            ...(correlationId
              ? { [CORRELATION_ID_HEADER]: correlationId }
              : {}),
          },
          validateStatus: () => true,
        }
      )
    );

    if (response.status >= 400) {
      throw new HttpException(response.data, response.status);
    }
    return response.data;
  }
}
