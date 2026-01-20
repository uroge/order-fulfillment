import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

@Injectable()
export class CorrelationIdService {
  private readonly storage = new AsyncLocalStorage<Map<string, string>>();

  run(correlationId: string, fn: () => void) {
    this.storage.run(new Map([['correlationId', correlationId]]), fn);
  }

  getId(): string | undefined {
    return this.storage.getStore()?.get('correlationId');
  }
}
