import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.auth-service') });

const sourceRoot = path.resolve(process.cwd(), 'apps/auth-service/src');

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [path.resolve(sourceRoot, '**/*.entity{.ts,.js}')],
  migrations: [path.resolve(sourceRoot, 'database/migrations/*{.ts,.js}')],
  synchronize: false,
});

export default dataSource;
