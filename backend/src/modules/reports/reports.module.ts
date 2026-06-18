import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { ReportTask } from './report-task.entity';
import { ReportFieldDraft } from './report-field-draft.entity';
import { Customer } from '../customers/customer.entity';
import { BankMaterialConfig } from '../banks/bank-material-config.entity';
import { Institution } from '../institutions/institution.entity';
import { CallRecord } from '../memberships/call-record.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReportTask,
      ReportFieldDraft,
      Customer,
      BankMaterialConfig,
      Institution,
      CallRecord,
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService, TypeOrmModule],
})
export class ReportsModule {}
