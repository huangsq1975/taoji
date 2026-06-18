import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
} from 'typeorm';

@Entity('customer_labels')
export class CustomerLabel {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Index('idx_customer_labels_customer')
  @Column({ name: 'customer_id', type: 'bigint' })
  customerId: number;

  @Column({ length: 50 })
  label: string;

  @Column({
    name: 'label_type',
    type: 'enum',
    enum: ['auto', 'manual'],
    default: 'auto',
  })
  labelType: string;
}
