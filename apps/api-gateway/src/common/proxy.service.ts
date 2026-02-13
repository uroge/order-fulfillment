import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ServiceTokenService } from './service-token.service';

type ProxyRequest = {
  baseUrl: URL;
  audience: string;
  method: 'GET' | 'POST';
  path: string;
  body?: unknown;
  headers?: Record<string, string>;
};

@Injectable()
export class ProxyService {
  constructor(
    private readonly httpService: HttpService,
    private readonly serviceTokenService: ServiceTokenService
  ) {}

  async forward<T>(request: ProxyRequest): Promise<{ status: number; data: T }> {
    const serviceToken = await this.serviceTokenService.createServiceToken(
      request.audience
    );
    const url = `${request.baseUrl.toString().replace(/\/$/, '')}${request.path}`;
    const headers = {
      ...(request.headers || {}),
      Authorization: `Bearer ${serviceToken}`,
    };

    const response = await firstValueFrom(
      this.httpService.request<T>({
        method: request.method,
        url,
        data: request.body,
        headers,
        validateStatus: () => true,
      })
    );

    return { status: response.status, data: response.data };
  }
}
