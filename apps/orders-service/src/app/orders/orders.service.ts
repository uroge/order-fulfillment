import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CancelOrderDto,
  CreateOrderDto,
  OrderResponseDto,
} from '@order-fulfillment/shared';
import { Order, OrderStatus } from './entities/order.entity';
import { Repository } from 'typeorm';
import {
  OrderEventType,
  OutboxEvent,
  OutboxStatus,
} from './entities/outbox-event.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>
  ) {}

  async getOrder(orderId: string, userId: string): Promise<OrderResponseDto> {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId, userId },
      relations: ['items'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return this.toOrderResponse(order);
  }

  async getOrdersForUser(userId: string): Promise<OrderResponseDto[]> {
    const orders = await this.ordersRepository.find({
      where: { userId },
      relations: ['items'],
    });
    return orders.map((order) => this.toOrderResponse(order));
  }

  async createOrder(
    userId: string,
    orderDto: CreateOrderDto
  ): Promise<OrderResponseDto> {
    const createdOrder = await this.ordersRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const total = orderDto.items.reduce(
          (sum, item) => sum + item.qty * item.price,
          0
        );

        const orderItems = orderDto.items.map((item) => ({
          sku: item.sku,
          qty: item.qty,
          price: item.price,
        }));

        const order = transactionalEntityManager.create(Order, {
          userId,
          status: OrderStatus.PENDING,
          total,
          items: orderItems,
        });

        await transactionalEntityManager.save(order);

        const outboxEvent = transactionalEntityManager.create(OutboxEvent, {
          createdAt: new Date(),
          processedAt: null,
          status: OutboxStatus.PENDING,
          eventType: OrderEventType.ORDER_CREATED,
          payload: {
            orderId: order.id,
            userId: order.userId,
            status: order.status,
            total: order.total,
            items: orderItems,
          },
        });

        await transactionalEntityManager.save(outboxEvent);
        return order;
      }
    );

    return this.toOrderResponse(createdOrder);
  }

  async cancelOrder(
    orderId: string,
    userId: string,
    cancelOrderDto: CancelOrderDto
  ): Promise<OrderResponseDto> {
    const updatedOrder = await this.ordersRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const order = await transactionalEntityManager.findOne(Order, {
          where: { id: orderId, userId },
        });

        if (!order) {
          throw new NotFoundException('Order not found');
        }

        if (order.status === OrderStatus.CANCELLED) {
          throw new BadRequestException('Order is already cancelled');
        }

        order.status = OrderStatus.CANCELLED;
        order.cancelReason = cancelOrderDto.reason ?? null;
        order.cancelledAt = new Date();
        const updatedOrder = await transactionalEntityManager.save(order);

        const outboxEvent = transactionalEntityManager.create(OutboxEvent, {
          createdAt: new Date(),
          processedAt: null,
          status: OutboxStatus.PENDING,
          eventType: OrderEventType.ORDER_CANCELLED,
          payload: {
            orderId: order.id,
            userId: order.userId,
            status: order.status,
            cancelReason: order.cancelReason,
            cancelledAt: order.cancelledAt,
          },
        });

        await transactionalEntityManager.save(outboxEvent);
        return updatedOrder;
      }
    );

    return this.toOrderResponse(updatedOrder);
  }

  private toOrderResponse(order: Order): OrderResponseDto {
    return {
      id: order.id,
      userId: order.userId,
      status: order.status,
      total: order.total,
      items: (order.items || []).map((item) => ({
        sku: item.sku,
        qty: item.qty,
        price: item.price,
      })),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      cancelReason: order.cancelReason ?? null,
      cancelledAt: order.cancelledAt ? order.cancelledAt.toISOString() : null,
    };
  }
}
