import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('bank_products')
export class BankProduct {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Index('idx_bank_products_bank')
  @Column({ name: 'bank_id', type: 'int' })
  bankId: number;

  @Column({ length: 100 })
  name: string;

  @Column({
    name: 'product_type',
    type: 'enum',
    enum: ['credit', 'mortgage', 'business', 'other'],
    default: 'business',
  })
  productType: string;

  @Column({ name: 'loan_min', type: 'decimal', precision: 15, scale: 2, nullable: true })
  loanMin: number;

  @Column({ name: 'loan_max', type: 'decimal', precision: 15, scale: 2, nullable: true })
  loanMax: number;

  @Column({ name: 'rate_min', type: 'decimal', precision: 5, scale: 4, nullable: true })
  rateMin: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  requirements: string;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'smallint', default: 1 })
  status: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
