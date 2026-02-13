import { ApiProperty } from '@nestjs/swagger';
import { OrderItemResponseDto } from './order-item-response.dto';

export class OrderResponseDto {
  @ApiProperty({ example: 'd7c018a6-f1c1-4f17-8e3b-926e0ba5faff' })
  id: string;

  @ApiProperty({ example: '5038cf7f-dd8d-40ad-a8bc-017bccad748c' })
  userId: string;

  @ApiProperty({ example: 'PENDING' })
  status: string;

  @ApiProperty({ example: 39.98 })
  total: number;

  @ApiProperty({ type: [OrderItemResponseDto] })
  items: OrderItemResponseDto[];

  @ApiProperty({ example: '2026-01-27T19:45:27.163Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-01-27T19:45:27.163Z' })
  updatedAt: string;

  @ApiProperty({ example: null, nullable: true })
  cancelReason: string | null;

  @ApiProperty({ example: null, nullable: true })
  cancelledAt: string | null;
}
