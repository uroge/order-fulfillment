import * as dotenv from 'dotenv';
import * as path from 'path';
import { buildDataSource } from '@order-fulfillment/shared';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'apps/orders-service/.env') });

const sourceRoot = path.resolve(process.cwd(), 'apps/orders-service/src');

const dataSource = buildDataSource({
  databaseUrl: process.env.DATABASE_URL,
  entitiesGlob: [
    path.resolve(sourceRoot, '**/*.entity{.ts,.js}'),
    path.resolve(process.cwd(), 'libs/shared/src/lib/orders/*.entity{.ts,.js}'),
  ],
  migrationsGlob: path.resolve(sourceRoot, 'database/migrations/*{.ts,.js}'),
});

export default dataSource;
