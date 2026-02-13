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

  async onModuleDestroy() {
    await this.channel?.close();
    await this.connection?.close();
  }
}
