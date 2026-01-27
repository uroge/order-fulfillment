import { Body, Controller, HttpException, Post, Req } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CORRELATION_ID_HEADER } from '@order-fulfillment/shared';
import { Request } from 'express';
import {
  LoginDto,
  LogoutDto,
  RefreshDto,
  RegisterDto,
} from '@order-fulfillment/shared';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ApiBody, ApiTags } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly authServiceUrl: URL;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService
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
  }

  @Post('register')
  @ApiBody({ type: RegisterDto })
  register(@Body() dto: RegisterDto, @Req() req: Request) {
    return this.forward('register', dto, req);
  }

  @Post('login')
  @ApiBody({ type: LoginDto })
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.forward('login', dto, req);
  }

  @Post('refresh')
  @ApiBody({ type: RefreshDto })
  refresh(@Body() dto: RefreshDto, @Req() req: Request) {
    return this.forward('refresh', dto, req);
  }

  @Post('logout')
  @ApiBody({ type: LogoutDto })
  logout(@Body() dto: LogoutDto, @Req() req: Request) {
    return this.forward('logout', dto, req);
  }

  private async forward(path: string, body: unknown, req: Request) {
    const headers: Record<string, string> = {};
    const correlationId = req.header(CORRELATION_ID_HEADER);
    if (correlationId) {
      headers[CORRELATION_ID_HEADER] = correlationId;
    }

    const response = await firstValueFrom(
      this.httpService.post(
        `${this.authServiceUrl.toString().replace(/\/$/, '')}/auth/${path}`,
        body,
        {
          headers,
          validateStatus: () => true,
        }
      )
    );

    if (response.status >= 400) {
      throw new HttpException(response.data, response.status);
    }

    return response.data;
  }
}
