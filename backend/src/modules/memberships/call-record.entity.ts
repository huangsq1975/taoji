import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum CallType {
  AI_RECOGNITION = 'ai_recognition',
  REPORT_FILL = 'report_fill',
  DOC_EXPORT = 'doc_export',
  API_CALL = 'api_call',
}

@Entity('call_records')
export class CallRecord {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Index('idx_call_records_inst_date')
  @Column({ name: 'institution_id', type: 'bigint' })
  institutionId: number;

  @Index('idx_call_records_user')
  @Column({ name: 'user_id', type: 'bigint' })
  userId: number;

  @Column({ name: 'customer_id', type: 'bigint', nullable: true })
  customerId: number;

  @Column({ name: 'task_id', type: 'bigint', nullable: true })
  taskId: number;

  @Column({
    name: 'call_type',
    type: 'enum',
    enum: CallType,
  })
  callType: CallType;

  @Column({ name: 'quota_cost', type: 'int', default: 1 })
  quotaCost: number;

  @Column({
    type: 'enum',
    enum: ['success', 'failed'],
    default: 'success',
  })
  status: string;

  @Column({ length: 255, nullable: true })
  detail: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
