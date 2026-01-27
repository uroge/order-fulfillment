import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import {
  LoginDto,
  RefreshDto,
  RegisterDto,
  LogoutDto,
} from '@order-fulfillment/shared';
import { UsersService } from '../users/users.service';
import { TokensService } from '../tokens/tokens.service';
import { User } from '../users/entities/user.entity';

const scrypt = promisify(scryptCallback);
const SCRYPT_KEYLEN = 64;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tokensService: TokensService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await this.hashPassword(dto.password);
    const user = await this.usersService.createUser(dto.email, passwordHash);

    return {
      email: dto.email,
      ...(await this.issueTokens(user)),
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const validPassword = await this.verifyPassword(
      dto.password,
      user.passwordHash
    );
    if (!validPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      email: dto.email,
      ...(await this.issueTokens(user)),
    };
  }

  async refresh(dto: RefreshDto) {
    const tokenRecord = await this.tokensService.findByToken(dto.refreshToken);
    if (!tokenRecord) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (tokenRecord.revokedAt) {
      await this.tokensService.revokeByTokenFamily(tokenRecord.tokenFamily);
      throw new ForbiddenException('Refresh token reuse detected');
    }
    if (tokenRecord.expiresAt <= new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    await this.tokensService.revokeTokenById(tokenRecord.id);
    const { accessToken, refreshToken } = await this.issueTokens(
      tokenRecord.user,
      tokenRecord.tokenFamily
    );

    return {
      accessToken,
      refreshToken,
    };
  }

  async logout(dto: LogoutDto) {
    const tokenRecord = await this.tokensService.findByToken(dto.refreshToken);
    if (!tokenRecord) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    await this.tokensService.revokeByToken(dto.refreshToken);
    return { status: 'ok' };
  }

  private async issueTokens(user: User, tokenFamily?: string) {
    const payload = { sub: user.id, roles: user.roles };
    const accessToken = await this.jwtService.signAsync(payload);
    const refreshTtlMs = this.parseDurationToMs(
      this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d'
    );
    const refreshTokenResult = await this.tokensService.createRefreshToken(
      user,
      refreshTtlMs,
      tokenFamily
    );

    return {
      accessToken,
      refreshToken: refreshTokenResult.token,
    };
  }

  private async hashPassword(password: string) {
    const salt = randomBytes(16).toString('hex');
    const derivedKey = (await scrypt(password, salt, SCRYPT_KEYLEN)) as Buffer;
    return `${salt}:${derivedKey.toString('hex')}`;
  }

  private async verifyPassword(password: string, storedHash: string) {
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) {
      return false;
    }
    const derivedKey = (await scrypt(password, salt, SCRYPT_KEYLEN)) as Buffer;
    const keyBuffer = Buffer.from(key, 'hex');
    return (
      keyBuffer.length === derivedKey.length &&
      timingSafeEqual(keyBuffer, derivedKey)
    );
  }

  private parseDurationToMs(value: string) {
    if (/^\d+$/.test(value)) {
      return Number(value) * 1000;
    }

    const match = value.match(/^(\d+)(ms|s|m|h|d)$/);
    if (!match) {
      return 0;
    }

    const amount = Number(match[1]);
    switch (match[2]) {
      case 'ms':
        return amount;
      case 's':
        return amount * 1000;
      case 'm':
        return amount * 60 * 1000;
      case 'h':
        return amount * 60 * 60 * 1000;
      case 'd':
        return amount * 24 * 60 * 60 * 1000;
      default:
        return 0;
    }
  }
}
