import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';

export enum UserRole {
  ADVISOR = 'advisor',
  SUPERVISOR = 'supervisor',
  ADMIN = 'admin',
}

export enum DataScope {
  SELF = 'self',
  TEAM = 'team',
  ALL = 'all',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Index('idx_users_institution')
  @Column({ name: 'institution_id', type: 'bigint' })
  institutionId: number;

  @Column({ length: 50 })
  name: string;

  @Index('idx_users_phone', { unique: true })
  @Column({ length: 20, unique: true })
  phone: string;

  @Column({ name: 'password_hash', length: 255 })
  passwordHash: string;

  @Column({ name: 'wx_openid', length: 64, nullable: true })
  wxOpenid: string;

  @Column({ name: 'wx_unionid', length: 64, nullable: true })
  wxUnionid: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.ADVISOR,
  })
  role: UserRole;

  @Column({
    name: 'data_scope',
    type: 'enum',
    enum: DataScope,
    default: DataScope.SELF,
  })
  dataScope: DataScope;

  @Column({ type: 'smallint', default: 1 })
  status: number;

  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;
}
