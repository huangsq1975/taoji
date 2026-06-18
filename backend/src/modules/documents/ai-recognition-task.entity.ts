import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum RecognitionTaskStatus {
  QUEUED = 'queued',
  PROCESSING = 'processing',
  DONE = 'done',
  FAILED = 'failed',
}

@Entity('ai_recognition_tasks')
export class AiRecognitionTask {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'institution_id', type: 'bigint' })
  institutionId: number;

  @Index('idx_ai_task_customer')
  @Column({ name: 'customer_id', type: 'bigint' })
  customerId: number;

  @Column({ name: 'trigger_user_id', type: 'bigint' })
  triggerUserId: number;

  @Column({
    type: 'enum',
    enum: ['single_doc', 'all_docs', 'reparse'],
    default: 'all_docs',
  })
  scope: string;

  @Column({ name: 'document_ids', type: 'jsonb', nullable: true })
  documentIds: number[];

  @Column({
    type: 'enum',
    enum: RecognitionTaskStatus,
    default: RecognitionTaskStatus.QUEUED,
  })
  status: RecognitionTaskStatus;

  @Column({ name: 'result_summary', type: 'text', nullable: true })
  resultSummary: string;

  @Column({ name: 'started_at', type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ name: 'finished_at', type: 'timestamp', nullable: true })
  finishedAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
