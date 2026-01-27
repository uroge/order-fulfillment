import * as dotenv from 'dotenv';
import * as path from 'path';
import { buildDataSource } from '@order-fulfillment/shared';
import { Order, OrderStatus } from '../app/orders/entities/order.entity';
import { OrderItem } from '../app/orders/entities/order-item.entity';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.orders-service') });

const sourceRoot = path.resolve(process.cwd(), 'apps/orders-service/src');

const dataSource = buildDataSource({
  databaseUrl: process.env.DATABASE_URL,
  entitiesGlob: path.resolve(sourceRoot, '**/*.entity{.ts,.js}'),
  migrationsGlob: path.resolve(sourceRoot, 'database/migrations/*{.ts,.js}'),
});

async function seed() {
  await dataSource.initialize();

  const orderRepo = dataSource.getRepository(Order);
  const orderItemRepo = dataSource.getRepository(OrderItem);

  const existing = await orderRepo.findOne({
    where: { userId: '00000000-0000-0000-0000-000000000001' },
  });

  if (!existing) {
    const order = orderRepo.create({
      userId: '00000000-0000-0000-0000-000000000001',
      status: OrderStatus.PENDING,
      total: 49.99,
      version: 1,
    });
    const savedOrder = await orderRepo.save(order);

    const items = [
      orderItemRepo.create({
        orderId: savedOrder.id,
        sku: 'SKU-123',
        qty: 1,
        price: 29.99,
      }),
      orderItemRepo.create({
        orderId: savedOrder.id,
        sku: 'SKU-456',
        qty: 1,
        price: 20.0,
      }),
    ];

    await orderItemRepo.save(items);
  }

  await dataSource.destroy();
}

seed().catch(async (err) => {
  console.error(err);
  await dataSource.destroy();
  process.exit(1);
});
