import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';

@Entity('institutions')
export class Institution {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ name: 'plan_id', type: 'int', default: 1 })
  planId: number;

  @Column({ name: 'quota_total', type: 'int', default: 30 })
  quotaTotal: number;

  @Column({ name: 'quota_used', type: 'int', default: 0 })
  quotaUsed: number;

  @Column({ name: 'quota_reset_at', type: 'date', nullable: true })
  quotaResetAt: Date;

  @Column({ type: 'smallint', default: 1 })
  status: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;
}
