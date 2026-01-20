import { Injectable, LoggerService } from '@nestjs/common';
import { CorrelationIdService } from '../correlation-id/correlation-id.service';

type LogLevel = 'log' | 'error' | 'warn' | 'debug' | 'verbose';

@Injectable()
export class JsonLoggerService implements LoggerService {
  private context?: string;

  constructor(private readonly correlationIds: CorrelationIdService) {}

  setContext(context: string) {
    this.context = context;
  }

  log(message: unknown, context?: string) {
    this.write('log', message, context);
  }

  error(message: unknown, stack?: string, context?: string) {
    this.write('error', message, context, stack ? { stack } : undefined);
  }

  warn(message: unknown, context?: string) {
    this.write('warn', message, context);
  }

  debug(message: unknown, context?: string) {
    this.write('debug', message, context);
  }

  verbose(message: unknown, context?: string) {
    this.write('verbose', message, context);
  }

  private write(
    level: LogLevel,
    message: unknown,
    context?: string,
    extra?: Record<string, unknown>
  ) {
    const payload: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      level,
      context: context ?? this.context,
      correlationId: this.correlationIds.getId(),
      message,
    };

    if (extra) {
      Object.assign(payload, extra);
    }

    console.log(JSON.stringify(payload));
  }
}
