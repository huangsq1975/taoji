import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { CustomerDocument } from './customer-document.entity';
import { AiRecognitionResult } from './ai-recognition-result.entity';
import { AiRecognitionTask } from './ai-recognition-task.entity';
import { Customer } from '../customers/customer.entity';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CustomerDocument,
      AiRecognitionResult,
      AiRecognitionTask,
      Customer,
    ]),
    UploadModule,
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService, TypeOrmModule],
})
export class DocumentsModule {}
