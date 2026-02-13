import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsString, Length, Min } from 'class-validator';

export class OrderItemDto {
  @ApiProperty({ example: 'SKU-123' })
  @IsString()
  @Length(1, 64)
  sku: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  qty: number;

  @ApiPropertyOptional({ example: 19.99 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number;
}
