import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('test')
export class TestController {
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get('protected')
  protectedRoute() {
    return { ok: true };
  }
}
