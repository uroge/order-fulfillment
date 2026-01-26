import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshDto {
  @ApiProperty({ example: 'refresh_token_here' })
  @IsString()
  @MinLength(10)
  refreshToken: string;
}
