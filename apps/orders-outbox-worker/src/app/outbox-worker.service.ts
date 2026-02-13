import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { OutboxEvent, OutboxStatus, RabbitMqService } from '@order-fulfillment/shared';
import { Repository } from 'typeorm';

@Injectable()
export class OutboxWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxWorkerService.name);
  private intervalHandle: NodeJS.Timeout | null = null;
  private polling = false;
  private readonly pollIntervalMs: number;
  private readonly batchSize: number;
  private readonly retryDelayMs: number;
  private readonly maxAttempts: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly rabbitMqService: RabbitMqService,
    @InjectRepository(OutboxEvent)
    private readonly outboxRepository: Repository<OutboxEvent>
  ) {
    this.pollIntervalMs = this.getNumberConfig('OUTBOX_POLL_INTERVAL_MS', 2000);
    this.batchSize = this.getNumberConfig('OUTBOX_BATCH_SIZE', 100);
    this.retryDelayMs = this.getNumberConfig('OUTBOX_RETRY_DELAY_MS', 5000);
    this.maxAttempts = this.getNumberConfig('OUTBOX_MAX_ATTEMPTS', 10);
  }

  async onModuleInit() {
    this.logger.log(
      `Outbox worker initialized (interval=${this.pollIntervalMs}ms, batchSize=${this.batchSize})`
    );
    this.intervalHandle = setInterval(() => {
      void this.pollOutbox();
    }, this.pollIntervalMs);
  }

  async onModuleDestroy() {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }

  private async pollOutbox(): Promise<void> {
    if (this.polling) {
      return;
    }

    this.polling = true;
    try {
      const events = await this.outboxRepository.manager.transaction(async (manager) => {
        const now = new Date();
        const candidates = await manager
          .getRepository(OutboxEvent)
          .createQueryBuilder('outbox')
          .setLock('pessimistic_write')
          .setOnLocked('skip_locked')
          .where('outbox.status IN (:...statuses)', {
            statuses: [OutboxStatus.PENDING, OutboxStatus.FAILED],
          })
          .andWhere('(outbox.nextAttemptAt IS NULL OR outbox.nextAttemptAt <= :now)', {
            now,
          })
          .orderBy('outbox.createdAt', 'ASC')
          .take(this.batchSize)
          .getMany();

        if (candidates.length === 0) {
          return [];
        }

        const ids = candidates.map((event) => event.id);
        await manager.query(
          `UPDATE "outbox_events"
           SET "status" = $1,
               "last_error" = NULL,
               "next_attempt_at" = NULL,
               "attempts" = "attempts" + 1
           WHERE "id" = ANY($2)`,
          [OutboxStatus.IN_PROGRESS, ids]
        );

        return candidates;
      });

      if (events.length === 0) {
        this.logger.debug('No pending outbox events');
        return;
      }

      this.logger.log(`Fetched ${events.length} outbox events`);

      for (const event of events) {
        await this.publishEvent(event);
      }
    } catch (error) {
      const err = error as Error;
      this.logger.error('Outbox polling failed', err.stack ?? String(err));
    } finally {
      this.polling = false;
    }
  }

  private async publishEvent(event: OutboxEvent): Promise<void> {
    try {
      await this.rabbitMqService.publish(event.eventType, event.payload, {
        headers: { 'x-event-id': event.id },
      });

      await this.outboxRepository.update(event.id, {
        status: OutboxStatus.PUBLISHED,
        processedAt: new Date(),
        lastError: null,
      });
    } catch (error) {
      const err = error as Error;
      const attempt = event.attempts + 1;
      const nextAttemptAt =
        attempt >= this.maxAttempts
          ? null
          : new Date(Date.now() + this.retryDelayMs);

      await this.outboxRepository.update(event.id, {
        status: OutboxStatus.FAILED,
        lastError: this.formatError(err),
        nextAttemptAt,
      });

      if (attempt >= this.maxAttempts) {
        this.logger.error(
          `Outbox event ${event.id} reached max attempts (${this.maxAttempts})`
        );
      } else {
        this.logger.warn(
          `Outbox event ${event.id} failed, retry scheduled at ${nextAttemptAt?.toISOString()}`
        );
      }
    }
  }

  private getNumberConfig(key: string, fallback: number): number {
    const raw = this.configService.get<string>(key);
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }

  private formatError(error: Error): string {
    return error.stack ?? error.message ?? 'Unknown error';
  }
}
