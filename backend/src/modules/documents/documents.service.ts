import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerDocument, AiParseStatus } from './customer-document.entity';
import { AiRecognitionResult } from './ai-recognition-result.entity';
import { AiRecognitionTask } from './ai-recognition-task.entity';
import { Customer } from '../customers/customer.entity';
import { UploadService } from '../upload/upload.service';
import { UploadDocumentDto } from './dto/upload-document.dto';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(CustomerDocument)
    private documentRepo: Repository<CustomerDocument>,
    @InjectRepository(AiRecognitionResult)
    private recognitionResultRepo: Repository<AiRecognitionResult>,
    @InjectRepository(AiRecognitionTask)
    private recognitionTaskRepo: Repository<AiRecognitionTask>,
    @InjectRepository(Customer)
    private customerRepo: Repository<Customer>,
    private uploadService: UploadService,
  ) {}

  async uploadDocument(
    file: Express.Multer.File,
    dto: UploadDocumentDto,
    institutionId: number,
    uploaderUserId: number,
    uploaderType: 'customer' | 'advisor' = 'advisor',
  ) {
    const customer = await this.customerRepo.findOne({
      where: { id: dto.customerId, institutionId },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const { url } = await this.uploadService.uploadFile(file, `customers/${dto.customerId}`);

    const document = this.documentRepo.create({
      customerId: dto.customerId,
      uploaderId: dto.uploaderId || uploaderUserId,
      uploaderType,
      docType: dto.docType,
      fileName: file.originalname,
      fileUrl: url,
      fileSize: file.size,
      mimeType: file.mimetype,
      aiParseStatus: AiParseStatus.PENDING,
    });

    return this.documentRepo.save(document);
  }

  async deleteDocument(institutionId: number, documentId: number, userId: number) {
    const doc = await this.documentRepo.findOne({ where: { id: documentId } });
    if (!doc) throw new NotFoundException('Document not found');

    const customer = await this.customerRepo.findOne({
      where: { id: doc.customerId, institutionId },
    });
    if (!customer) throw new ForbiddenException('Access denied');

    await this.documentRepo.softDelete(documentId);
    return { success: true };
  }

  async getRecognitionSummary(institutionId: number, customerId: number) {
    const customer = await this.customerRepo.findOne({
      where: { id: customerId, institutionId },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    const documents = await this.documentRepo.find({ where: { customerId } });
    const results = await this.recognitionResultRepo.find({ where: { customerId } });

    const missingFields = results.filter((r) => r.status === 'missing');
    const abnormalFields = results.filter((r) => r.status === 'abnormal');
    const needsReviewFields = results.filter((r) => r.status === 'needs_review');

    // Latest recognition task
    const latestTask = await this.recognitionTaskRepo.findOne({
      where: { customerId },
      order: { createdAt: 'DESC' },
    });

    return {
      customerId,
      documentCount: documents.length,
      recognizedFieldCount: results.length,
      missingFields,
      abnormalFields,
      needsReviewFields,
      docCompleteness: customer.docCompleteness,
      latestTask,
      summary: latestTask?.resultSummary || null,
    };
  }
}
