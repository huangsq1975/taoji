import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('customer_authorizations')
export class CustomerAuthorization {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Index('idx_customer_auth_customer')
  @Column({ name: 'customer_id', type: 'bigint' })
  customerId: number;

  @Column({
    name: 'auth_type',
    type: 'enum',
    enum: ['credit_check', 'data_use', 'third_party'],
  })
  authType: string;

  @Column({ name: 'signed_at', type: 'timestamp', nullable: true })
  signedAt: Date;

  @Column({ name: 'expired_at', type: 'timestamp', nullable: true })
  expiredAt: Date;

  @Column({ name: 'file_url', length: 500, nullable: true })
  fileUrl: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'signed', 'expired', 'revoked'],
    default: 'pending',
  })
  status: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
