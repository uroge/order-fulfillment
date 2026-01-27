import * as dotenv from 'dotenv';
import * as path from 'path';
import { buildDataSource } from '@order-fulfillment/shared';
import { User } from '../app/users/entities/user.entity';
import { randomBytes, scrypt as scryptCallback } from 'crypto';
import { promisify } from 'util';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'apps/auth-service/.env') });

const sourceRoot = path.resolve(process.cwd(), 'apps/auth-service/src');

const dataSource = buildDataSource({
  databaseUrl: process.env.DATABASE_URL,
  entitiesGlob: path.resolve(sourceRoot, '**/*.entity{.ts,.js}'),
  migrationsGlob: path.resolve(sourceRoot, 'database/migrations/*{.ts,.js}'),
});

const scrypt = promisify(scryptCallback);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString('hex')}`;
}

async function seed() {
  await dataSource.initialize();

  const userRepo = dataSource.getRepository(User);
  const existing = await userRepo.findOne({
    where: { email: 'test@example.com' },
  });

  if (!existing) {
    const passwordHash = await hashPassword('Password123');
    const user = userRepo.create({
      email: 'test@example.com',
      passwordHash,
      roles: ['USER'],
    });
    await userRepo.save(user);
  }

  await dataSource.destroy();
}

seed().catch(async (err) => {
  console.error(err);
  await dataSource.destroy();
  process.exit(1);
});
