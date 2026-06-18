import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
} from 'typeorm';

@Entity('report_field_drafts')
export class ReportFieldDraft {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Index('idx_report_field_drafts_task')
  @Column({ name: 'task_id', type: 'bigint' })
  taskId: number;

  @Column({ name: 'field_key', length: 100 })
  fieldKey: string;

  @Column({ name: 'field_label', length: 100 })
  fieldLabel: string;

  @Column({ name: 'ai_value', type: 'text', nullable: true })
  aiValue: string;

  @Column({ name: 'final_value', type: 'text', nullable: true })
  finalValue: string;

  @Column({ name: 'source_doc_id', type: 'bigint', nullable: true })
  sourceDocId: number;

  @Column({ name: 'source_hint', length: 255, nullable: true })
  sourceHint: string;

  @Column({
    name: 'ai_status',
    type: 'enum',
    enum: ['ok', 'issue', 'missing', 'needs_review'],
    default: 'ok',
  })
  aiStatus: string;

  @Column({ name: 'ai_note', length: 255, nullable: true })
  aiNote: string;

  @Column({
    name: 'review_status',
    type: 'enum',
    enum: ['pending', 'approved', 'corrected', 'rejected'],
    default: 'pending',
  })
  reviewStatus: string;

  @Column({ name: 'reviewed_by', type: 'bigint', nullable: true })
  reviewedBy: number;

  @Column({ name: 'reviewed_at', type: 'timestamp', nullable: true })
  reviewedAt: Date;
}
