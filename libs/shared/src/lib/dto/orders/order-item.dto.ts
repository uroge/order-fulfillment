import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, IsString, Length, Min } from 'class-validator';

export class OrderItemDto {
  @ApiProperty({ example: 'SKU-123' })
  @IsString()
  @Length(1, 64)
  sku: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  qty: number;

  @ApiProperty({ example: 19.99 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;
}
