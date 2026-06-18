import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

@Entity('platform_configs')
export class PlatformConfig {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ name: 'config_key', length: 100, unique: true })
  configKey: string;

  @Column({ name: 'config_val', type: 'text', nullable: true })
  configVal: string;

  @Column({ length: 255, nullable: true })
  description: string;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
