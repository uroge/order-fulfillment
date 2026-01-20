import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { CORRELATION_ID_HEADER } from './correlation-id.constants';
import { CorrelationIdService } from './correlation-id.service';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  constructor(private readonly correlationIds: CorrelationIdService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const incoming = req.header(CORRELATION_ID_HEADER);
    const correlationId = incoming && incoming.trim() ? incoming : randomUUID();

    res.setHeader(CORRELATION_ID_HEADER, correlationId);

    this.correlationIds.run(correlationId, () => next());
  }
}
