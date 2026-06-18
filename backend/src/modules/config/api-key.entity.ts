import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('api_keys')
export class ApiKey {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Index('idx_api_keys_institution')
  @Column({ name: 'institution_id', type: 'bigint' })
  institutionId: number;

  @Column({ name: 'key_hash', length: 255 })
  keyHash: string;

  @Column({ name: 'key_prefix', length: 10 })
  keyPrefix: string;

  @Column({ length: 50, nullable: true })
  name: string;

  @Column({
    type: 'enum',
    enum: ['active', 'revoked'],
    default: 'active',
  })
  status: string;

  @Column({ name: 'last_used_at', type: 'timestamp', nullable: true })
  lastUsedAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
