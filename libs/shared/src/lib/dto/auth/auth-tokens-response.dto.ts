import { ApiProperty } from '@nestjs/swagger';

export class AuthTokensResponseDto {
  @ApiProperty({ example: 'Login accepted' })
  message: string;

  @ApiProperty({ example: 'user@example.com' })
  email?: string;

  @ApiProperty({ example: 'access-token' })
  accessToken: string;

  @ApiProperty({ example: 'refresh-token' })
  refreshToken: string;
}

export class AuthMessageResponseDto {
  @ApiProperty({ example: 'Logout accepted' })
  message: string;
}
