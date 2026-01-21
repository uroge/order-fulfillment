import { Injectable } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { LogoutDto } from './dto/logout.dto';

@Injectable()
export class AuthService {
  register(dto: RegisterDto) {
    return {
      message: 'Registration accepted',
      email: dto.email,
      ...this.stubTokens(),
    };
  }

  login(dto: LoginDto) {
    return {
      message: 'Login accepted',
      email: dto.email,
      ...this.stubTokens(),
    };
  }

  refresh(_dto: RefreshDto) {
    return {
      message: 'Refresh accepted',
      ...this.stubTokens(),
    };
  }

  logout(_dto: LogoutDto) {
    return { message: 'Logout accepted' };
  }

  private stubTokens() {
    return {
      accessToken: 'todo-access-token',
      refreshToken: 'todo-refresh-token',
    };
  }
}
