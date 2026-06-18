import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { AiRecognitionTask, RecognitionTaskStatus } from '../documents/ai-recognition-task.entity';
import { CustomerDocument } from '../documents/customer-document.entity';
import { Customer } from '../customers/customer.entity';
import { Institution } from '../institutions/institution.entity';
import { CallRecord, CallType } from '../memberships/call-record.entity';

export interface TriggerRecognitionDto {
  customerId: number;
  scope?: 'single_doc' | 'all_docs' | 'reparse';
  documentIds?: number[];
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    @InjectRepository(AiRecognitionTask)
    private taskRepo: Repository<AiRecognitionTask>,
    @InjectRepository(CustomerDocument)
    private documentRepo: Repository<CustomerDocument>,
    @InjectRepository(Customer)
    private customerRepo: Repository<Customer>,
    @InjectRepository(Institution)
    private institutionRepo: Repository<Institution>,
    @InjectRepository(CallRecord)
    private callRecordRepo: Repository<CallRecord>,
    @InjectQueue('ai-recognition')
    private recognitionQueue: Queue,
  ) {}

  async triggerRecognition(
    institutionId: number,
    userId: number,
    dto: TriggerRecognitionDto,
  ) {
    const customer = await this.customerRepo.findOne({
      where: { id: dto.customerId, institutionId },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    const institution = await this.institutionRepo.findOne({ where: { id: institutionId } });
    if (!institution) throw new NotFoundException('Institution not found');

    if (institution.quotaUsed >= institution.quotaTotal) {
      throw new BadRequestException('Monthly quota exceeded');
    }

    // Determine which documents to recognize
    let documentIds = dto.documentIds;
    if (!documentIds || documentIds.length === 0) {
      const docs = await this.documentRepo.find({ where: { customerId: dto.customerId } });
      documentIds = docs.map((d) => d.id);
    }

    const task = this.taskRepo.create({
      institutionId,
      customerId: dto.customerId,
      triggerUserId: userId,
      scope: dto.scope || 'all_docs',
      documentIds,
      status: RecognitionTaskStatus.QUEUED,
    });

    const savedTask = await this.taskRepo.save(task);

    // Enqueue for async processing
    await this.recognitionQueue.add(
      'recognize',
      {
        taskId: savedTask.id,
        customerId: dto.customerId,
        institutionId,
        documentIds,
      },
      { attempts: 3, backoff: { type: 'exponential', delay: 2000 } },
    );

    // Deduct quota
    await this.institutionRepo.update(institutionId, {
      quotaUsed: institution.quotaUsed + 1,
    });

    await this.callRecordRepo.save(
      this.callRecordRepo.create({
        institutionId,
        userId,
        customerId: dto.customerId,
        taskId: savedTask.id,
        callType: CallType.AI_RECOGNITION,
        quotaCost: 1,
        status: 'success',
      }),
    );

    return { taskId: savedTask.id, status: RecognitionTaskStatus.QUEUED };
  }

  async getTaskStatus(taskId: number, institutionId: number) {
    const task = await this.taskRepo.findOne({
      where: { id: taskId, institutionId },
    });
    if (!task) throw new NotFoundException('Recognition task not found');
    return task;
  }

  async callAiApi(prompt: string, context?: any): Promise<string> {
    // Stub AI API call - in production call real LLM API
    this.logger.log(`[AI STUB] Calling AI with prompt length: ${prompt.length}`);
    await new Promise((r) => setTimeout(r, 100)); // Simulate latency
    return `[AI STUB RESPONSE] Processed prompt about: ${prompt.substring(0, 50)}...`;
  }
}
