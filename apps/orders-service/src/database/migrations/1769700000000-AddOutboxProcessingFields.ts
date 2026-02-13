import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOutboxProcessingFields1769700000000 implements MigrationInterface {
  name = 'AddOutboxProcessingFields1769700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."outbox_events_status_enum" ADD VALUE IF NOT EXISTS 'IN_PROGRESS'`
    );
    await queryRunner.query(
      `ALTER TABLE "outbox_events" ADD "attempts" integer NOT NULL DEFAULT 0`
    );
    await queryRunner.query(
      `ALTER TABLE "outbox_events" ADD "next_attempt_at" TIMESTAMP WITH TIME ZONE`
    );
    await queryRunner.query(`ALTER TABLE "outbox_events" ADD "last_error" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "outbox_events" DROP COLUMN "last_error"`);
    await queryRunner.query(
      `ALTER TABLE "outbox_events" DROP COLUMN "next_attempt_at"`
    );
    await queryRunner.query(`ALTER TABLE "outbox_events" DROP COLUMN "attempts"`);
    await queryRunner.query(
      `CREATE TYPE "public"."outbox_events_status_enum_old" AS ENUM('PENDING', 'PUBLISHED', 'FAILED')`
    );
    await queryRunner.query(
      `ALTER TABLE "outbox_events" ALTER COLUMN "status" TYPE "public"."outbox_events_status_enum_old" USING "status"::text::"public"."outbox_events_status_enum_old"`
    );
    await queryRunner.query(`DROP TYPE "public"."outbox_events_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."outbox_events_status_enum_old" RENAME TO "outbox_events_status_enum"`
    );
  }
}
