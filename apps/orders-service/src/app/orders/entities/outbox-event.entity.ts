import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum OutboxStatus {
  PENDING = 'PENDING',
  PUBLISHED = 'PUBLISHED',
  FAILED = 'FAILED',
}

@Entity({ name: 'outbox_events' })
export class OutboxEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'event_type' })
  eventType!: string;

  @Column({ name: 'payload', type: 'jsonb' })
  payload!: Record<string, unknown>;

  @Column({ name: 'status', type: 'enum', enum: OutboxStatus, default: OutboxStatus.PENDING })
  status!: OutboxStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Column({ name: 'processed_at', type: 'timestamptz', nullable: true })
  processedAt!: Date | null;
}
