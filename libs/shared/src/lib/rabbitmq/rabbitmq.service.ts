import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { connect, ConfirmChannel, ChannelModel, Options } from 'amqplib';

@Injectable()
export class RabbitMqService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMqService.name);
  private connection: ChannelModel | null = null;
  private channel: ConfirmChannel | null = null;
  private exchange: string | null = null;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const url = this.configService.get<string>('RABBITMQ_URL');
    const exchange = this.configService.get<string>('RABBITMQ_EXCHANGE');
    if (!url || !exchange) {
      throw new Error('RABBITMQ_URL and RABBITMQ_EXCHANGE are required');
    }

    this.connection = await connect(url);
    this.channel = await this.connection.createConfirmChannel();
    await this.channel.assertExchange(exchange, 'topic', { durable: true });
    this.exchange = exchange;
    await this.setupConsumerTopology(exchange);
    this.logger.log(`RabbitMQ connected to exchange ${exchange}`);
  }

  getChannel(): ConfirmChannel {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }
    return this.channel;
  }

  async publish(
    routingKey: string,
    payload: unknown,
    options: Options.Publish = {}
  ): Promise<void> {
    if (!this.channel || !this.exchange) {
      throw new Error('RabbitMQ channel not initialized');
    }

    const buffer = Buffer.from(JSON.stringify(payload));
    const ok = this.channel.publish(this.exchange, routingKey, buffer, {
      contentType: 'application/json',
      persistent: true,
      ...options,
    });

    if (!ok) {
      this.logger.warn('RabbitMQ publish returned false (backpressure)');
    }

    await this.channel.waitForConfirms();
  }

  private async setupConsumerTopology(exchange: string): Promise<void> {
    if (!this.channel) {
      return;
    }

    const queue = this.configService.get<string>('RABBITMQ_QUEUE');
    if (!queue) {
      return;
    }

    const retryTtlMs = this.getNumberConfig('RABBITMQ_RETRY_TTL_MS', 10000);
    const prefetch = this.getNumberConfig('RABBITMQ_PREFETCH', 10);
    const routingKeys = this.getRoutingKeys();
    const dlx =
      this.configService.get<string>('RABBITMQ_DLX') || `${queue}.dlx`;
    const retryRoutingKey = `${queue}.retry`;
    const requeueRoutingKey = `${queue}.requeue`;
    const dlqRoutingKey = `${queue}.dlq`;
    const retryQueue = `${queue}.retry`;
    const deadLetterQueue = `${queue}.dlq`;

    await this.channel.assertExchange(dlx, 'direct', { durable: true });

    await this.channel.assertQueue(queue, {
      durable: true,
      deadLetterExchange: dlx,
      deadLetterRoutingKey: retryRoutingKey,
    });
    for (const routingKey of routingKeys) {
      await this.channel.bindQueue(queue, exchange, routingKey);
    }
    // Service-owned requeue key lets retry topology work with any domain routing keys.
    await this.channel.bindQueue(queue, exchange, requeueRoutingKey);

    await this.channel.assertQueue(retryQueue, {
      durable: true,
      messageTtl: retryTtlMs,
      deadLetterExchange: exchange,
      deadLetterRoutingKey: requeueRoutingKey,
    });
    await this.channel.bindQueue(retryQueue, dlx, retryRoutingKey);

    await this.channel.assertQueue(deadLetterQueue, { durable: true });
    await this.channel.bindQueue(deadLetterQueue, dlx, dlqRoutingKey);

    await this.channel.prefetch(prefetch);
    this.logger.log(
      `RabbitMQ topology ready for queue ${queue} (bindings=${routingKeys.join(', ')}, retry=${retryQueue}, dlq=${deadLetterQueue})`
    );
  }

  private getNumberConfig(key: string, fallback: number): number {
    const raw = this.configService.get<string>(key);
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }

  private getRoutingKeys(): string[] {
    const routingKeysRaw = this.configService.get<string>('RABBITMQ_ROUTING_KEYS');
    if (routingKeysRaw) {
      const keys = routingKeysRaw
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
      if (keys.length > 0) {
        return keys;
      }
    }

    const singleKey = this.configService.get<string>('RABBITMQ_ROUTING_KEY');
    if (singleKey) {
      return [singleKey];
    }

    return ['#'];
  }

  async onModuleDestroy() {
    await this.channel?.close();
    await this.connection?.close();
  }
}
