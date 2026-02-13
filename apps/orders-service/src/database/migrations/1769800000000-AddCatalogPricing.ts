import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCatalogPricing1769800000000 implements MigrationInterface {
  name = 'AddCatalogPricing1769800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "orders" ADD "currency" character varying(3) NOT NULL DEFAULT 'USD'`
    );

    await queryRunner.query(
      `CREATE TABLE "catalog_prices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sku" character varying(64) NOT NULL, "currency" character varying(3) NOT NULL, "unit_price" numeric(10,2) NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "uq_catalog_prices_sku_currency" UNIQUE ("sku", "currency"), CONSTRAINT "PK_5e6fa46656773f7ecf99445752b" PRIMARY KEY ("id"))`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "catalog_prices"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "currency"`);
  }
}
