import { Body, Controller, HttpException, Post, Req } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AuthMessageResponseDto,
  AuthTokensResponseDto,
  CORRELATION_ID_HEADER,
} from '@order-fulfillment/shared';
import { Request } from 'express';
import {
  LoginDto,
  LogoutDto,
  RefreshDto,
  RegisterDto,
} from '@order-fulfillment/shared';
import { ApiBody } from '@nestjs/swagger';
import { ProxyService } from '../common/proxy.service';

@Controller('auth')
export class AuthController {
  private readonly authServiceUrl: URL;
  private readonly authServiceAudience: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly proxyService: ProxyService
  ) {
    const rawUrl = this.configService.get<string>('AUTH_SERVICE_URL');
    if (!rawUrl) {
      throw new Error('AUTH_SERVICE_URL is required');
    }
    try {
      this.authServiceUrl = new URL(rawUrl);
    } catch {
      throw new Error(`AUTH_SERVICE_URL is invalid: ${rawUrl}`);
    }
    this.authServiceAudience =
      this.configService.get<string>('AUTH_SERVICE_AUDIENCE') ||
      this.configService.get<string>('SERVICE_TOKEN_AUDIENCE');
    if (!this.authServiceAudience) {
      throw new Error('AUTH_SERVICE_AUDIENCE is required');
    }
  }

  @Post('register')
  @ApiBody({ type: RegisterDto })
  register(@Body() dto: RegisterDto, @Req() req: Request) {
    return this.forwardTokens('register', dto, req);
  }

  @Post('login')
  @ApiBody({ type: LoginDto })
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.forwardTokens('login', dto, req);
  }

  @Post('refresh')
  @ApiBody({ type: RefreshDto })
  refresh(@Body() dto: RefreshDto, @Req() req: Request) {
    return this.forwardTokens('refresh', dto, req);
  }

  @Post('logout')
  @ApiBody({ type: LogoutDto })
  logout(@Body() dto: LogoutDto, @Req() req: Request) {
    return this.forwardMessage('logout', dto, req);
  }

  private async forwardTokens(
    path: string,
    body: unknown,
    req: Request
  ): Promise<AuthTokensResponseDto> {
    const headers: Record<string, string> = {};
    const correlationId = req.header(CORRELATION_ID_HEADER);
    if (correlationId) {
      headers[CORRELATION_ID_HEADER] = correlationId;
    }

    const response = await this.proxyService.forward<AuthTokensResponseDto>({
      baseUrl: this.authServiceUrl,
      audience: this.authServiceAudience,
      method: 'POST',
      path: `/auth/${path}`,
      body,
      headers,
    });

    if (response.status >= 400) {
      throw new HttpException(response.data, response.status);
    }

    return {
      message: response.data.message,
      email: response.data.email,
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken,
    };
  }

  private async forwardMessage(
    path: string,
    body: unknown,
    req: Request
  ): Promise<AuthMessageResponseDto> {
    const headers: Record<string, string> = {};
    const correlationId = req.header(CORRELATION_ID_HEADER);
    if (correlationId) {
      headers[CORRELATION_ID_HEADER] = correlationId;
    }

    const response = await this.proxyService.forward<AuthMessageResponseDto>({
      baseUrl: this.authServiceUrl,
      audience: this.authServiceAudience,
      method: 'POST',
      path: `/auth/${path}`,
      body,
      headers,
    });

    if (response.status >= 400) {
      throw new HttpException(response.data, response.status);
    }

    return { message: response.data.message };
  }
}
