import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';

export enum CustomerStatus {
  COLLECTING = 'collecting',
  REVIEWING = 'reviewing',
  REPORTING = 'reporting',
  SUBMITTED = 'submitted',
  DONE = 'done',
  PAUSED = 'paused',
}

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Index('idx_customers_institution')
  @Column({ name: 'institution_id', type: 'bigint' })
  institutionId: number;

  @Index('idx_customers_advisor')
  @Column({ name: 'advisor_id', type: 'bigint' })
  advisorId: number;

  @Column({ length: 100 })
  name: string;

  @Column({ name: 'contact_name', length: 50, nullable: true })
  contactName: string;

  @Column({ name: 'contact_phone', length: 20, nullable: true })
  contactPhone: string;

  @Column({ name: 'wx_openid', length: 64, nullable: true })
  wxOpenid: string;

  @Column({ name: 'financing_need', type: 'text', nullable: true })
  financingNeed: string;

  @Column({ name: 'loan_amount', type: 'decimal', precision: 15, scale: 2, nullable: true })
  loanAmount: number;

  @Column({ name: 'loan_purpose', length: 255, nullable: true })
  loanPurpose: string;

  @Index('idx_customers_status')
  @Column({
    type: 'enum',
    enum: CustomerStatus,
    default: CustomerStatus.COLLECTING,
  })
  status: CustomerStatus;

  @Column({ name: 'doc_completeness', type: 'smallint', default: 0 })
  docCompleteness: number;

  @Column({ name: 'ai_summary', type: 'text', nullable: true })
  aiSummary: string;

  @Column({ name: 'risk_notes', type: 'text', nullable: true })
  riskNotes: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;
}
