import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
} from 'typeorm';

@Entity('user_permissions')
export class UserPermission {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Index('idx_user_permissions_user')
  @Column({ name: 'user_id', type: 'bigint' })
  userId: number;

  @Column({ length: 50 })
  permission: string;
}
