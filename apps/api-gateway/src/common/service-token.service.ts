import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ServiceTokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async createServiceToken(audience: string) {
    const issuer = this.configService.get<string>('SERVICE_TOKEN_ISSUER');
    const secret = this.configService.get<string>('SERVICE_JWT_SECRET');
    if (!issuer || !secret) {
      throw new Error('Service token config is missing');
    }

    return this.jwtService.signAsync(
      { sub: 'api-gateway', type: 'service' },
      { issuer, audience, secret }
    );
  }
}
