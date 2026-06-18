import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('ai_recognition_results')
export class AiRecognitionResult {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Index('idx_ai_recog_document')
  @Column({ name: 'document_id', type: 'bigint' })
  documentId: number;

  @Index('idx_ai_recog_customer')
  @Column({ name: 'customer_id', type: 'bigint' })
  customerId: number;

  @Column({ name: 'field_key', length: 100 })
  fieldKey: string;

  @Column({ name: 'field_label', length: 100 })
  fieldLabel: string;

  @Column({ name: 'field_value', type: 'text', nullable: true })
  fieldValue: string;

  @Column({ type: 'decimal', precision: 5, scale: 4, nullable: true })
  confidence: number;

  @Column({
    type: 'enum',
    enum: ['ok', 'missing', 'abnormal', 'needs_review'],
    default: 'ok',
  })
  status: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  note: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
