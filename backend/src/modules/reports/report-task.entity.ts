import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ReportTaskStatus {
  PENDING = 'pending',
  AI_FILLING = 'ai_filling',
  AI_DONE = 'ai_done',
  REVIEWING = 'reviewing',
  REVIEW_DONE = 'review_done',
  EXPORTING = 'exporting',
  EXPORTED = 'exported',
  SUBMITTED = 'submitted',
}

@Entity('report_tasks')
export class ReportTask {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'institution_id', type: 'bigint' })
  institutionId: number;

  @Index('idx_report_tasks_customer')
  @Column({ name: 'customer_id', type: 'bigint' })
  customerId: number;

  @Index('idx_report_tasks_advisor')
  @Column({ name: 'advisor_id', type: 'bigint' })
  advisorId: number;

  @Column({ name: 'product_id', type: 'int' })
  productId: number;

  @Index('idx_report_tasks_status')
  @Column({
    type: 'enum',
    enum: ReportTaskStatus,
    default: ReportTaskStatus.PENDING,
  })
  status: ReportTaskStatus;

  @Column({ name: 'ai_fill_at', type: 'timestamp', nullable: true })
  aiFillAt: Date;

  @Column({ name: 'reviewed_at', type: 'timestamp', nullable: true })
  reviewedAt: Date;

  @Column({ name: 'exported_at', type: 'timestamp', nullable: true })
  exportedAt: Date;

  @Column({ name: 'submitted_at', type: 'timestamp', nullable: true })
  submittedAt: Date;

  @Column({ name: 'export_url', length: 500, nullable: true })
  exportUrl: string;

  @Column({ name: 'issue_count', type: 'int', default: 0 })
  issueCount: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
