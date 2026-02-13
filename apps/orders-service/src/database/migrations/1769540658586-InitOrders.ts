import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitOrders1769540658586 implements MigrationInterface {
  name = 'InitOrders1769540658586';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "orders" ADD "cancel_reason" text`);
    await queryRunner.query(
      `ALTER TABLE "orders" ADD "cancelled_at" TIMESTAMP WITH TIME ZONE`
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "version" DROP DEFAULT`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "version" SET DEFAULT '1'`
    );
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "cancelled_at"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "cancel_reason"`);
  }
}
