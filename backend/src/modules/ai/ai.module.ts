import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { AiProcessor } from './ai.processor';
import { AiRecognitionTask } from '../documents/ai-recognition-task.entity';
import { AiRecognitionResult } from '../documents/ai-recognition-result.entity';
import { CustomerDocument } from '../documents/customer-document.entity';
import { Customer } from '../customers/customer.entity';
import { Institution } from '../institutions/institution.entity';
import { CallRecord } from '../memberships/call-record.entity';
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AiRecognitionTask,
      AiRecognitionResult,
      CustomerDocument,
      Customer,
      Institution,
      CallRecord,
    ]),
    BullModule.registerQueue({
      name: 'ai-recognition',
    }),
    DocumentsModule,
  ],
  controllers: [AiController],
  providers: [AiService, AiProcessor],
  exports: [AiService],
})
export class AiModule {}
