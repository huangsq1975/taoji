import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('chat_sessions')
export class ChatSession {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'customer_id', type: 'bigint' })
  customerId: number;

  @Column({
    type: 'enum',
    enum: ['c_end', 'advisor_mobile', 'advisor_pc'],
    default: 'c_end',
  })
  source: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
