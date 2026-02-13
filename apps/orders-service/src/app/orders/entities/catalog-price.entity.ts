import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { decimalToNumber } from '@order-fulfillment/shared';

@Entity({ name: 'catalog_prices' })
@Unique('uq_catalog_prices_sku_currency', ['sku', 'currency'])
export class CatalogPrice {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'sku', length: 64 })
  sku!: string;

  @Column({ name: 'currency', length: 3 })
  currency!: string;

  @Column({
    name: 'unit_price',
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: decimalToNumber,
  })
  unitPrice!: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
