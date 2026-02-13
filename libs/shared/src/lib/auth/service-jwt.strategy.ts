import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

type ServiceTokenPayload = {
  sub: string;
  type?: string;
  roles?: string[];
};

@Injectable()
export class ServiceJwtStrategy extends PassportStrategy(Strategy, 'service') {
  constructor(config: ConfigService) {
    const secret = config.get<string>('SERVICE_JWT_SECRET');
    if (!secret) {
      throw new UnauthorizedException('SERVICE_JWT_SECRET is required');
    }
    const issuer = config.get<string>('SERVICE_TOKEN_ISSUER');
    const audience = config.get<string>('SERVICE_TOKEN_AUDIENCE');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secret,
      issuer: issuer,
      audience: audience,
    });
  }

  validate(payload: ServiceTokenPayload) {
    if (payload.type && payload.type !== 'service') {
      throw new UnauthorizedException('Invalid token type');
    }
    return payload;
  }
}
