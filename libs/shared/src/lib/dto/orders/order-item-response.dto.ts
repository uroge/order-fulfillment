import { ApiProperty } from '@nestjs/swagger';

export class OrderItemResponseDto {
  @ApiProperty({ example: 'SKU-123' })
  sku: string;

  @ApiProperty({ example: 2 })
  qty: number;

  @ApiProperty({ example: 19.99 })
  price: number;
}
