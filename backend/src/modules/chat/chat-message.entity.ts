import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Index('idx_chat_messages_session')
  @Column({ name: 'session_id', type: 'bigint' })
  sessionId: number;

  @Column({
    type: 'enum',
    enum: ['user', 'assistant'],
  })
  role: string;

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
