import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { Customer } from './customer.entity';
import { CustomerLabel } from './customer-label.entity';
import { FollowUpRecord } from './follow-up-record.entity';
import { CustomerAuthorization } from './customer-authorization.entity';
import { CustomerDocument } from '../documents/customer-document.entity';
import { ReportTask } from '../reports/report-task.entity';
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Customer,
      CustomerLabel,
      FollowUpRecord,
      CustomerAuthorization,
      CustomerDocument,
      ReportTask,
    ]),
    DocumentsModule,
  ],
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [CustomersService, TypeOrmModule],
})
export class CustomersModule {}
