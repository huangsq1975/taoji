import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReportTask, ReportTaskStatus } from './report-task.entity';
import { ReportFieldDraft } from './report-field-draft.entity';
import { Customer } from '../customers/customer.entity';
import { BankMaterialConfig } from '../banks/bank-material-config.entity';
import { Institution } from '../institutions/institution.entity';
import { CallRecord, CallType } from '../memberships/call-record.entity';
import { CreateReportTaskDto } from './dto/create-report-task.dto';
import { UpdateFieldDto } from './dto/update-field.dto';
import { QueryReportTasksDto } from './dto/query-report-tasks.dto';
import { paginate } from '../../common/dto/pagination.dto';
import { DataScope } from '../users/user.entity';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(ReportTask)
    private taskRepo: Repository<ReportTask>,
    @InjectRepository(ReportFieldDraft)
    private fieldDraftRepo: Repository<ReportFieldDraft>,
    @InjectRepository(Customer)
    private customerRepo: Repository<Customer>,
    @InjectRepository(BankMaterialConfig)
    private materialConfigRepo: Repository<BankMaterialConfig>,
    @InjectRepository(Institution)
    private institutionRepo: Repository<Institution>,
    @InjectRepository(CallRecord)
    private callRecordRepo: Repository<CallRecord>,
  ) {}

  async findAll(
    institutionId: number,
    currentUserId: number,
    dataScope: DataScope,
    query: QueryReportTasksDto,
  ) {
    const { page = 1, pageSize = 20, status, customerId, advisorId } = query;

    const qb = this.taskRepo
      .createQueryBuilder('rt')
      .where('rt.institution_id = :institutionId', { institutionId });

    if (dataScope === DataScope.SELF) {
      qb.andWhere('rt.advisor_id = :currentUserId', { currentUserId });
    }

    if (status) qb.andWhere('rt.status = :status', { status });
    if (customerId) qb.andWhere('rt.customer_id = :customerId', { customerId });
    if (advisorId) qb.andWhere('rt.advisor_id = :advisorId', { advisorId });

    qb.orderBy('rt.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [items, total] = await qb.getManyAndCount();
    return paginate(items, total, page, pageSize);
  }

  async create(institutionId: number, advisorId: number, dto: CreateReportTaskDto) {
    // Check quota
    const institution = await this.institutionRepo.findOne({ where: { id: institutionId } });
    if (!institution) throw new NotFoundException('Institution not found');

    if (institution.quotaUsed >= institution.quotaTotal) {
      throw new BadRequestException('Monthly quota exceeded. Please upgrade your plan.');
    }

    const customer = await this.customerRepo.findOne({
      where: { id: dto.customerId, institutionId },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    // Check if product has material config
    const configs = await this.materialConfigRepo.find({
      where: { productId: dto.productId },
      order: { sortOrder: 'ASC' },
    });

    // Create task
    const task = this.taskRepo.create({
      institutionId,
      customerId: dto.customerId,
      advisorId,
      productId: dto.productId,
      status: ReportTaskStatus.AI_FILLING,
      aiFillAt: new Date(),
    });

    const savedTask = await this.taskRepo.save(task);

    // Generate field drafts from material config (AI fills with mock data)
    if (configs.length > 0) {
      const drafts = configs.map((config) => {
        const aiValue = this.mockAiFill(config.fieldKey, customer);
        return this.fieldDraftRepo.create({
          taskId: savedTask.id,
          fieldKey: config.fieldKey,
          fieldLabel: config.fieldLabel,
          aiValue,
          aiStatus: aiValue ? 'ok' : 'missing',
          aiNote: aiValue ? null : 'AI无法从现有资料中找到该字段',
          sourceHint: config.sourceHint,
          reviewStatus: 'pending',
        });
      });

      await this.fieldDraftRepo.save(drafts);

      const issueCount = drafts.filter((d) => d.aiStatus !== 'ok').length;
      await this.taskRepo.update(savedTask.id, {
        status: ReportTaskStatus.AI_DONE,
        issueCount,
      });
    } else {
      await this.taskRepo.update(savedTask.id, {
        status: ReportTaskStatus.AI_DONE,
        issueCount: 0,
      });
    }

    // Deduct quota and record call
    await this.institutionRepo.update(institutionId, {
      quotaUsed: institution.quotaUsed + 1,
    });

    await this.callRecordRepo.save(
      this.callRecordRepo.create({
        institutionId,
        userId: advisorId,
        customerId: dto.customerId,
        taskId: savedTask.id,
        callType: CallType.REPORT_FILL,
        quotaCost: 1,
        status: 'success',
        detail: `AI filled report task #${savedTask.id}`,
      }),
    );

    return this.findOne(savedTask.id, institutionId);
  }

  async findOne(id: number, institutionId: number) {
    const task = await this.taskRepo.findOne({
      where: { id, institutionId },
    });
    if (!task) throw new NotFoundException('Report task not found');

    const fieldDrafts = await this.fieldDraftRepo.find({
      where: { taskId: id },
      order: { id: 'ASC' },
    });

    return { ...task, fieldDrafts };
  }

  async updateField(
    taskId: number,
    fieldId: number,
    institutionId: number,
    advisorId: number,
    dto: UpdateFieldDto,
  ) {
    const task = await this.taskRepo.findOne({ where: { id: taskId, institutionId } });
    if (!task) throw new NotFoundException('Report task not found');

    const field = await this.fieldDraftRepo.findOne({ where: { id: fieldId, taskId } });
    if (!field) throw new NotFoundException('Field not found');

    await this.fieldDraftRepo.update(fieldId, {
      finalValue: dto.finalValue,
      reviewStatus: dto.reviewStatus || 'approved',
      reviewedBy: advisorId,
      reviewedAt: new Date(),
    });

    // Update task status if it was ai_done, move to reviewing
    if (task.status === ReportTaskStatus.AI_DONE) {
      await this.taskRepo.update(taskId, { status: ReportTaskStatus.REVIEWING });
    }

    return this.fieldDraftRepo.findOne({ where: { id: fieldId } });
  }

  async approve(taskId: number, institutionId: number, advisorId: number) {
    const task = await this.taskRepo.findOne({ where: { id: taskId, institutionId } });
    if (!task) throw new NotFoundException('Report task not found');

    if (
      task.status !== ReportTaskStatus.REVIEWING &&
      task.status !== ReportTaskStatus.AI_DONE
    ) {
      throw new BadRequestException(`Task cannot be approved from status: ${task.status}`);
    }

    // Check all fields are reviewed
    const pendingFields = await this.fieldDraftRepo.count({
      where: { taskId, reviewStatus: 'pending' },
    });

    if (pendingFields > 0) {
      throw new BadRequestException(
        `${pendingFields} field(s) still pending review. Please review all fields before approving.`,
      );
    }

    await this.taskRepo.update(taskId, {
      status: ReportTaskStatus.REVIEW_DONE,
      reviewedAt: new Date(),
    });

    return { success: true, taskId, newStatus: ReportTaskStatus.REVIEW_DONE };
  }

  async export(taskId: number, institutionId: number, advisorId: number) {
    const task = await this.taskRepo.findOne({ where: { id: taskId, institutionId } });
    if (!task) throw new NotFoundException('Report task not found');

    if (task.status !== ReportTaskStatus.REVIEW_DONE) {
      throw new BadRequestException('Task must be review_done before exporting');
    }

    await this.taskRepo.update(taskId, { status: ReportTaskStatus.EXPORTING });

    // Stub: generate ZIP file
    const exportUrl = await this.generateExportZip(task);

    await this.taskRepo.update(taskId, {
      status: ReportTaskStatus.EXPORTED,
      exportUrl,
      exportedAt: new Date(),
    });

    // Record call
    const institution = await this.institutionRepo.findOne({ where: { id: institutionId } });
    await this.institutionRepo.update(institutionId, {
      quotaUsed: institution.quotaUsed + 1,
    });

    await this.callRecordRepo.save(
      this.callRecordRepo.create({
        institutionId,
        userId: advisorId,
        customerId: task.customerId,
        taskId,
        callType: CallType.DOC_EXPORT,
        quotaCost: 1,
        status: 'success',
        detail: `Exported report task #${taskId}`,
      }),
    );

    return { success: true, exportUrl };
  }

  async submit(taskId: number, institutionId: number, advisorId: number) {
    const task = await this.taskRepo.findOne({ where: { id: taskId, institutionId } });
    if (!task) throw new NotFoundException('Report task not found');

    if (task.status !== ReportTaskStatus.EXPORTED) {
      throw new BadRequestException('Task must be exported before submission');
    }

    await this.taskRepo.update(taskId, {
      status: ReportTaskStatus.SUBMITTED,
      submittedAt: new Date(),
    });

    return { success: true, taskId, newStatus: ReportTaskStatus.SUBMITTED };
  }

  private mockAiFill(fieldKey: string, customer: Customer): string | null {
    const mockData: Record<string, string> = {
      company_name: customer.name,
      contact_name: customer.contactName || '',
      contact_phone: customer.contactPhone || '',
      loan_amount: customer.loanAmount ? String(customer.loanAmount) : '',
      loan_purpose: customer.loanPurpose || '',
      financing_need: customer.financingNeed || '',
    };

    return mockData[fieldKey] ?? null;
  }

  private async generateExportZip(task: ReportTask): Promise<string> {
    // Stub: in production, use archiver to ZIP documents + filled forms
    const exportDir = path.join(process.cwd(), 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const fileName = `report_task_${task.id}_${Date.now()}.zip`;
    const filePath = path.join(exportDir, fileName);

    // Write stub zip placeholder
    fs.writeFileSync(filePath, `Report export for task ${task.id} - stub`);

    return `http://localhost:3000/exports/${fileName}`;
  }
}
