import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('institution_subscriptions')
export class InstitutionSubscription {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Index('idx_inst_subs_institution')
  @Column({ name: 'institution_id', type: 'bigint' })
  institutionId: number;

  @Column({ name: 'plan_id', type: 'int' })
  planId: number;

  @Column({ name: 'started_at', type: 'timestamp' })
  startedAt: Date;

  @Column({ name: 'expired_at', type: 'timestamp', nullable: true })
  expiredAt: Date;

  @Column({
    type: 'enum',
    enum: ['active', 'expired', 'cancelled'],
    default: 'active',
  })
  status: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
