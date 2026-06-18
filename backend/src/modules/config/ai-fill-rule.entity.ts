import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('ai_fill_rules')
export class AiFillRule {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ name: 'institution_id', type: 'bigint', nullable: true })
  institutionId: number;

  @Column({ length: 100 })
  name: string;

  @Column({
    type: 'enum',
    enum: ['form_fill', 'biz_data', 'credit_parse', 'doc_export', 'source_diagram'],
  })
  scene: string;

  @Column({
    name: 'review_policy',
    type: 'enum',
    enum: ['advisor_confirm', 'amount_fields', 'all_fields', 'auto_no_review'],
    default: 'advisor_confirm',
  })
  reviewPolicy: string;

  @Column({ name: 'mapping_desc', type: 'text', nullable: true })
  mappingDesc: string;

  @Column({ type: 'smallint', default: 1 })
  status: number;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @Column({ name: 'created_by', type: 'bigint', nullable: true })
  createdBy: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
