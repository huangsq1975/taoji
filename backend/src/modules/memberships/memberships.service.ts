import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MembershipPlan } from './membership-plan.entity';
import { InstitutionSubscription } from './institution-subscription.entity';
import { CallRecord } from './call-record.entity';
import { Institution } from '../institutions/institution.entity';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';

@Injectable()
export class MembershipsService {
  constructor(
    @InjectRepository(MembershipPlan)
    private planRepo: Repository<MembershipPlan>,
    @InjectRepository(InstitutionSubscription)
    private subscriptionRepo: Repository<InstitutionSubscription>,
    @InjectRepository(CallRecord)
    private callRecordRepo: Repository<CallRecord>,
    @InjectRepository(Institution)
    private institutionRepo: Repository<Institution>,
  ) {}

  async getPlans() {
    return this.planRepo.find({
      where: { isActive: 1 },
      order: { sortOrder: 'ASC' },
    });
  }

  async getSubscription(institutionId: number) {
    const institution = await this.institutionRepo.findOne({ where: { id: institutionId } });
    if (!institution) throw new NotFoundException('Institution not found');

    const subscription = await this.subscriptionRepo.findOne({
      where: { institutionId, status: 'active' },
      order: { createdAt: 'DESC' },
    });

    const plan = await this.planRepo.findOne({ where: { id: institution.planId } });

    return {
      institution: {
        id: institution.id,
        name: institution.name,
        quotaTotal: institution.quotaTotal,
        quotaUsed: institution.quotaUsed,
        quotaRemaining: institution.quotaTotal - institution.quotaUsed,
        quotaResetAt: institution.quotaResetAt,
      },
      subscription,
      plan,
    };
  }

  async getCallRecords(institutionId: number, pagination: PaginationDto, userId?: number) {
    const { page = 1, pageSize = 20 } = pagination;

    const qb = this.callRecordRepo
      .createQueryBuilder('cr')
      .where('cr.institution_id = :institutionId', { institutionId });

    if (userId) {
      qb.andWhere('cr.user_id = :userId', { userId });
    }

    qb.orderBy('cr.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [items, total] = await qb.getManyAndCount();
    return paginate(items, total, page, pageSize);
  }

  async submitUpgradeRequest(institutionId: number, planId: number, userId: number) {
    // Stub: in production, this would create a payment order or notify admin
    return {
      success: true,
      message: 'Upgrade request submitted. Our team will contact you shortly.',
      requestedPlanId: planId,
    };
  }
}
