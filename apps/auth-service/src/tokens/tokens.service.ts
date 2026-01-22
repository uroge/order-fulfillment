import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshToken } from './entities/refresh-token.entity';
import { User } from '../users/entities/user.entity';
import { createHash, randomBytes, randomUUID } from 'crypto';

@Injectable()
export class TokensService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokensRepository: Repository<RefreshToken>
  ) {}

  async createRefreshToken(user: User, ttlMs: number, tokenFamily?: string) {
    const token = randomBytes(32).toString('base64url');
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(Date.now() + ttlMs);

    const refreshToken = this.refreshTokensRepository.create({
      tokenHash,
      tokenFamily: tokenFamily ?? randomUUID(),
      expiresAt,
      user,
      userId: user.id,
    });

    await this.refreshTokensRepository.save(refreshToken);

    return {
      token,
      tokenFamily: refreshToken.tokenFamily,
      expiresAt: refreshToken.expiresAt,
    };
  }

  async findByToken(token: string) {
    const tokenHash = this.hashToken(token);
    return this.refreshTokensRepository.findOne({
      where: { tokenHash },
      relations: ['user'],
    });
  }

  async revokeByToken(token: string) {
    const tokenHash = this.hashToken(token);
    await this.refreshTokensRepository.update(
      { tokenHash },
      { revokedAt: new Date() }
    );
  }

  async revokeTokenById(tokenId: string) {
    await this.refreshTokensRepository.update(tokenId, { revokedAt: new Date() });
  }

  async revokeByTokenFamily(tokenFamily: string) {
    await this.refreshTokensRepository.update(
      { tokenFamily },
      { revokedAt: new Date() }
    );
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }
}
