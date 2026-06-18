import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
} from 'typeorm';

@Entity('bank_material_configs')
export class BankMaterialConfig {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Index('idx_bank_material_product')
  @Column({ name: 'product_id', type: 'int' })
  productId: number;

  @Column({ name: 'field_key', length: 100 })
  fieldKey: string;

  @Column({ name: 'field_label', length: 100 })
  fieldLabel: string;

  @Column({
    name: 'field_type',
    type: 'enum',
    enum: ['text', 'number', 'date', 'enum', 'file', 'boolean'],
    default: 'text',
  })
  fieldType: string;

  @Column({ type: 'smallint', default: 1 })
  required: number;

  @Column({ name: 'source_hint', length: 255, nullable: true })
  sourceHint: string;

  @Column({ name: 'review_required', type: 'smallint', default: 1 })
  reviewRequired: number;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;
}
