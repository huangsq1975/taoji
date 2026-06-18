import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity('membership_plans')
export class MembershipPlan {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ length: 50 })
  name: string;

  @Column({ name: 'monthly_quota', type: 'int' })
  monthlyQuota: number;

  @Column({ name: 'max_advisors', type: 'int', default: 1 })
  maxAdvisors: number;

  @Column({ type: 'jsonb', nullable: true })
  features: Record<string, any>;

  @Column({ name: 'price_monthly', type: 'decimal', precision: 10, scale: 2, default: 0 })
  priceMonthly: number;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @Column({ name: 'is_active', type: 'smallint', default: 1 })
  isActive: number;
}
