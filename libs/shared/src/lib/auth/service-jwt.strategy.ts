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
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get<string>('SERVICE_JWT_SECRET'),
      issuer: config.get<string>('SERVICE_TOKEN_ISSUER'),
      audience: config.get<string>('SERVICE_TOKEN_AUDIENCE'),
    });
  }

  validate(payload: ServiceTokenPayload) {
    if (payload.type && payload.type !== 'service') {
      throw new UnauthorizedException('Invalid token type');
    }
    return payload;
  }
}
