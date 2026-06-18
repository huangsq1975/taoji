import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum FollowUpType {
  NOTE = 'note',
  SUPPLEMENT_REQUEST = 'supplement_request',
  BANK_SUBMIT = 'bank_submit',
  BANK_FEEDBACK = 'bank_feedback',
  SYSTEM = 'system',
}

@Entity('follow_up_records')
export class FollowUpRecord {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Index('idx_follow_up_customer')
  @Column({ name: 'customer_id', type: 'bigint' })
  customerId: number;

  @Column({ name: 'advisor_id', type: 'bigint' })
  advisorId: number;

  @Column({
    type: 'enum',
    enum: FollowUpType,
    default: FollowUpType.NOTE,
  })
  type: FollowUpType;

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
