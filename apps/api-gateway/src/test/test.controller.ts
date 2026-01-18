import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Controller('test')
export class TestController {
  @UseGuards(AuthGuard('jwt'))
  @Get('protected')
  protectedRoute() {
    return { ok: true };
  }
}
