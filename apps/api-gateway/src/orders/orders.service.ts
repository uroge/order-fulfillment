import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OrdersService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async createServiceToken() {
    const issuer = this.configService.get<string>('SERVICE_TOKEN_ISSUER');
    const audience = this.configService.get<string>('SERVICE_TOKEN_AUDIENCE');
    const secret = this.configService.get<string>('SERVICE_JWT_SECRET');
    if (!issuer || !audience || !secret) {
      throw new Error('Service token config is missing');
    }

    return this.jwtService.signAsync(
      { sub: 'api-gateway', type: 'service' },
      { issuer, audience, secret }
    );
  }
}
