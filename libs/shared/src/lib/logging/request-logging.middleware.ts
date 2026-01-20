import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { CorrelationIdService } from '../correlation-id/correlation-id.service';
import { JsonLoggerService } from './json-logger.service';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  constructor(
    private readonly correlationIds: CorrelationIdService,
    private readonly logger: JsonLoggerService
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    const startedAt = Date.now();

    res.on('finish', () => {
      const durationMs = Date.now() - startedAt;
      const meta = {
        correlationId: this.correlationIds.getId(),
        method: req.method,
        path: req.originalUrl ?? req.url,
        statusCode: res.statusCode,
        durationMs,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      };

      this.logger.log(meta, 'HTTP');
    });

    next();
  }
}
