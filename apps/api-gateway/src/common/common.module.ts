import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ServiceTokenService } from './service-token.service';
import { ProxyService } from './proxy.service';

@Module({
  imports: [HttpModule],
  providers: [ServiceTokenService, ProxyService],
  exports: [ServiceTokenService, ProxyService],
})
export class CommonModule {}
