import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembershipsController } from './memberships.controller';
import { MembershipsService } from './memberships.service';
import { MembershipPlan } from './membership-plan.entity';
import { InstitutionSubscription } from './institution-subscription.entity';
import { CallRecord } from './call-record.entity';
import { Institution } from '../institutions/institution.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MembershipPlan,
      InstitutionSubscription,
      CallRecord,
      Institution,
    ]),
  ],
  controllers: [MembershipsController],
  providers: [MembershipsService],
  exports: [MembershipsService, TypeOrmModule],
})
export class MembershipsModule {}
