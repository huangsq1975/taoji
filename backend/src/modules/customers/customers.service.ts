import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer, CustomerStatus } from './customer.entity';
import { CustomerLabel } from './customer-label.entity';
import { FollowUpRecord, FollowUpType } from './follow-up-record.entity';
import { CustomerAuthorization } from './customer-authorization.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomersDto } from './dto/query-customers.dto';
import { CreateFollowUpDto } from './dto/create-follow-up.dto';
import { paginate } from '../../common/dto/pagination.dto';
import { DataScope } from '../users/user.entity';
import { CustomerDocument } from '../documents/customer-document.entity';
import { ReportTask } from '../reports/report-task.entity';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private customerRepo: Repository<Customer>,
    @InjectRepository(CustomerLabel)
    private labelRepo: Repository<CustomerLabel>,
    @InjectRepository(FollowUpRecord)
    private followUpRepo: Repository<FollowUpRecord>,
    @InjectRepository(CustomerAuthorization)
    private authorizationRepo: Repository<CustomerAuthorization>,
    @InjectRepository(CustomerDocument)
    private documentRepo: Repository<CustomerDocument>,
    @InjectRepository(ReportTask)
    private reportTaskRepo: Repository<ReportTask>,
  ) {}

  async findAll(
    institutionId: number,
    currentUserId: number,
    dataScope: DataScope,
    query: QueryCustomersDto,
  ) {
    const { page = 1, pageSize = 20, keyword, status, advisorId } = query;

    const qb = this.customerRepo
      .createQueryBuilder('c')
      .where('c.institution_id = :institutionId', { institutionId })
      .andWhere('c.deleted_at IS NULL');

    // Data scope filtering
    if (dataScope === DataScope.SELF) {
      qb.andWhere('c.advisor_id = :currentUserId', { currentUserId });
    } else if (dataScope === DataScope.TEAM) {
      // For simplicity, team = same institution (could be refined with team structure)
      // Supervisor sees their advisees - stub: same as all for now
    }
    // DataScope.ALL = no extra filter

    if (keyword) {
      qb.andWhere('(c.name ILIKE :kw OR c.contact_phone LIKE :kw2)', {
        kw: `%${keyword}%`,
        kw2: `%${keyword}%`,
      });
    }

    if (status) {
      qb.andWhere('c.status = :status', { status });
    }

    if (advisorId) {
      qb.andWhere('c.advisor_id = :advisorId', { advisorId });
    }

    qb.orderBy('c.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [items, total] = await qb.getManyAndCount();
    return paginate(items, total, page, pageSize);
  }

  async create(
    institutionId: number,
    currentUserId: number,
    dto: CreateCustomerDto,
  ) {
    const customer = this.customerRepo.create({
      institutionId,
      advisorId: dto.advisorId || currentUserId,
      name: dto.name,
      contactName: dto.contactName,
      contactPhone: dto.contactPhone,
      financingNeed: dto.financingNeed,
      loanAmount: dto.loanAmount,
      loanPurpose: dto.loanPurpose,
      status: CustomerStatus.COLLECTING,
    });

    const saved = await this.customerRepo.save(customer);

    // Add system follow-up record
    await this.followUpRepo.save(
      this.followUpRepo.create({
        customerId: saved.id,
        advisorId: currentUserId,
        type: FollowUpType.SYSTEM,
        content: '客户已创建，开始资料收集阶段',
      }),
    );

    return saved;
  }

  async findOne(institutionId: number, currentUserId: number, dataScope: DataScope, id: number) {
    const customer = await this.customerRepo.findOne({
      where: { id, institutionId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    this.checkAccess(customer, currentUserId, dataScope);

    const labels = await this.labelRepo.find({ where: { customerId: id } });
    return { ...customer, labels };
  }

  async update(institutionId: number, currentUserId: number, dataScope: DataScope, id: number, dto: UpdateCustomerDto) {
    const customer = await this.customerRepo.findOne({ where: { id, institutionId } });
    if (!customer) throw new NotFoundException('Customer not found');
    this.checkAccess(customer, currentUserId, dataScope);

    await this.customerRepo.update(id, dto);
    return this.customerRepo.findOne({ where: { id } });
  }

  async getOverview(institutionId: number, currentUserId: number, dataScope: DataScope, id: number) {
    const customer = await this.findOne(institutionId, currentUserId, dataScope, id);
    const labels = await this.labelRepo.find({ where: { customerId: id } });
    const documents = await this.documentRepo.find({ where: { customerId: id } });
    const reportTasks = await this.reportTaskRepo.find({ where: { customerId: id } });
    const authorizations = await this.authorizationRepo.find({ where: { customerId: id } });

    const docByType: Record<string, number> = {};
    for (const doc of documents) {
      docByType[doc.docType] = (docByType[doc.docType] || 0) + 1;
    }

    return {
      customer,
      labels,
      docCompleteness: customer.docCompleteness,
      documentCount: documents.length,
      documentsByType: docByType,
      reportTaskCount: reportTasks.length,
      latestReportStatus: reportTasks[reportTasks.length - 1]?.status || null,
      authorizations,
      aiSummary: customer.aiSummary,
      riskNotes: customer.riskNotes,
    };
  }

  async getDocuments(institutionId: number, currentUserId: number, dataScope: DataScope, id: number) {
    const customer = await this.customerRepo.findOne({ where: { id, institutionId } });
    if (!customer) throw new NotFoundException('Customer not found');
    this.checkAccess(customer, currentUserId, dataScope);

    return this.documentRepo.find({
      where: { customerId: id },
      order: { createdAt: 'DESC' },
    });
  }

  async getFollowUps(institutionId: number, currentUserId: number, dataScope: DataScope, id: number) {
    const customer = await this.customerRepo.findOne({ where: { id, institutionId } });
    if (!customer) throw new NotFoundException('Customer not found');
    this.checkAccess(customer, currentUserId, dataScope);

    return this.followUpRepo.find({
      where: { customerId: id },
      order: { createdAt: 'DESC' },
    });
  }

  async addFollowUp(institutionId: number, currentUserId: number, dataScope: DataScope, id: number, dto: CreateFollowUpDto) {
    const customer = await this.customerRepo.findOne({ where: { id, institutionId } });
    if (!customer) throw new NotFoundException('Customer not found');
    this.checkAccess(customer, currentUserId, dataScope);

    const record = this.followUpRepo.create({
      customerId: id,
      advisorId: currentUserId,
      type: dto.type,
      content: dto.content,
    });

    return this.followUpRepo.save(record);
  }

  async getReportTasks(institutionId: number, currentUserId: number, dataScope: DataScope, id: number) {
    const customer = await this.customerRepo.findOne({ where: { id, institutionId } });
    if (!customer) throw new NotFoundException('Customer not found');
    this.checkAccess(customer, currentUserId, dataScope);

    return this.reportTaskRepo.find({
      where: { customerId: id },
      order: { createdAt: 'DESC' },
    });
  }

  private checkAccess(customer: Customer, currentUserId: number, dataScope: DataScope) {
    if (dataScope === DataScope.SELF && customer.advisorId !== currentUserId) {
      throw new ForbiddenException('You do not have access to this customer');
    }
    // TEAM and ALL: no extra restriction here (team-level filtering done at query level)
  }
}
