import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { AiRecognitionTask, RecognitionTaskStatus } from '../documents/ai-recognition-task.entity';
import { AiRecognitionResult } from '../documents/ai-recognition-result.entity';
import { CustomerDocument, AiParseStatus } from '../documents/customer-document.entity';
import { Customer } from '../customers/customer.entity';

interface RecognitionJobData {
  taskId: number;
  customerId: number;
  institutionId: number;
  documentIds: number[];
}

@Processor('ai-recognition')
export class AiProcessor {
  private readonly logger = new Logger(AiProcessor.name);

  constructor(
    @InjectRepository(AiRecognitionTask)
    private taskRepo: Repository<AiRecognitionTask>,
    @InjectRepository(AiRecognitionResult)
    private resultRepo: Repository<AiRecognitionResult>,
    @InjectRepository(CustomerDocument)
    private documentRepo: Repository<CustomerDocument>,
    @InjectRepository(Customer)
    private customerRepo: Repository<Customer>,
  ) {}

  @Process('recognize')
  async handleRecognition(job: Job<RecognitionJobData>) {
    const { taskId, customerId, institutionId, documentIds } = job.data;
    this.logger.log(`Processing AI recognition task ${taskId} for customer ${customerId}`);

    // Mark task as processing
    await this.taskRepo.update(taskId, {
      status: RecognitionTaskStatus.PROCESSING,
      startedAt: new Date(),
    });

    try {
      const results: AiRecognitionResult[] = [];
      const docTypes: string[] = [];

      for (const docId of documentIds) {
        const doc = await this.documentRepo.findOne({ where: { id: docId } });
        if (!doc) continue;

        // Mark doc as processing
        await this.documentRepo.update(docId, { aiParseStatus: AiParseStatus.PROCESSING });

        // Simulate AI recognition (stub)
        const mockResults = this.mockRecognizeDocument(doc, customerId);
        results.push(...mockResults);
        docTypes.push(doc.docType);

        // Mark doc as done
        await this.documentRepo.update(docId, {
          aiParseStatus: AiParseStatus.DONE,
          aiParsedAt: new Date(),
        });
      }

      // Save recognition results
      if (results.length > 0) {
        await this.resultRepo.save(results);
      }

      // Calculate doc completeness
      const completeness = this.calculateCompleteness(docTypes);

      // Update customer
      await this.customerRepo.update(customerId, {
        docCompleteness: completeness,
        aiSummary: this.generateSummary(results, docTypes),
      });

      // Build gap summary
      const missingFields = results.filter((r) => r.status === 'missing');
      const resultSummary = missingFields.length > 0
        ? `识别完成。发现 ${missingFields.length} 个缺失字段: ${missingFields.map((f) => f.fieldLabel).join('、')}`
        : '识别完成。所有字段均已成功提取，无缺口。';

      // Mark task done
      await this.taskRepo.update(taskId, {
        status: RecognitionTaskStatus.DONE,
        resultSummary,
        finishedAt: new Date(),
      });

      this.logger.log(`Task ${taskId} completed. Recognized ${results.length} fields.`);
    } catch (err) {
      this.logger.error(`Task ${taskId} failed: ${err.message}`, err.stack);

      await this.taskRepo.update(taskId, {
        status: RecognitionTaskStatus.FAILED,
        resultSummary: `识别失败: ${err.message}`,
        finishedAt: new Date(),
      });

      // Mark all docs as failed
      for (const docId of documentIds) {
        await this.documentRepo.update(docId, { aiParseStatus: AiParseStatus.FAILED });
      }

      throw err;
    }
  }

  private mockRecognizeDocument(doc: CustomerDocument, customerId: number): AiRecognitionResult[] {
    const results: Partial<AiRecognitionResult>[] = [];

    const fieldsByType: Record<string, Array<{ key: string; label: string; value: string | null }>> = {
      business_license: [
        { key: 'company_name', label: '企业名称', value: '某某科技有限公司 (模拟)' },
        { key: 'unified_credit_code', label: '统一社会信用代码', value: '91110000XXXXXXXXXX' },
        { key: 'legal_person', label: '法定代表人', value: '张三 (模拟)' },
        { key: 'registered_capital', label: '注册资本', value: '500万元人民币' },
        { key: 'establishment_date', label: '成立日期', value: '2020-01-01' },
      ],
      bank_statement: [
        { key: 'account_holder', label: '账户名称', value: '某某科技有限公司' },
        { key: 'account_number', label: '账号', value: null },
        { key: 'avg_monthly_flow', label: '月均流水', value: '150万元 (模拟)' },
        { key: 'bank_name', label: '开户行', value: '中国工商银行' },
      ],
      id_card: [
        { key: 'id_name', label: '姓名', value: '张三 (模拟)' },
        { key: 'id_number', label: '身份证号', value: '110101XXXXXXXXXX' },
        { key: 'id_address', label: '住址', value: '北京市某区某街道' },
      ],
      credit_report: [
        { key: 'credit_score', label: '信用评分', value: null },
        { key: 'outstanding_loans', label: '未结清贷款', value: '无 (模拟)' },
        { key: 'overdue_records', label: '逾期记录', value: null },
      ],
    };

    const fields = fieldsByType[doc.docType] || [
      { key: 'doc_content', label: '文件内容', value: '内容已识别 (模拟)' },
    ];

    for (const field of fields) {
      const result = new AiRecognitionResult();
      result.documentId = doc.id;
      result.customerId = customerId;
      result.fieldKey = field.key;
      result.fieldLabel = field.label;
      result.fieldValue = field.value;
      result.confidence = field.value ? 0.92 : null;
      result.status = field.value ? 'ok' : 'missing';
      result.note = field.value ? null : '该字段在文件中未找到，请补充';
      results.push(result);
    }

    return results as AiRecognitionResult[];
  }

  private calculateCompleteness(docTypes: string[]): number {
    const requiredTypes = ['business_license', 'bank_statement', 'id_card'];
    const presentTypes = new Set(docTypes);
    const count = requiredTypes.filter((t) => presentTypes.has(t)).length;
    return Math.round((count / requiredTypes.length) * 100);
  }

  private generateSummary(results: AiRecognitionResult[], docTypes: string[]): string {
    const okCount = results.filter((r) => r.status === 'ok').length;
    const missingCount = results.filter((r) => r.status === 'missing').length;
    return `AI分析完成。已识别 ${okCount} 个字段，${missingCount} 个字段缺失。资料涵盖: ${docTypes.join('、')}。AI建议：请补充完整资料以提升获批概率。注意：AI输出仅供参考，最终以银行及持牌金融机构审核为准。`;
  }
}
