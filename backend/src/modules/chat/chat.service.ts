import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ChatSession } from './chat-session.entity';
import { ChatMessage } from './chat-message.entity';
import { Customer } from '../customers/customer.entity';
import { CustomerDocument } from '../documents/customer-document.entity';
import { CreateSessionDto, SendMessageDto } from './dto/chat.dto';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectRepository(ChatSession)
    private sessionRepo: Repository<ChatSession>,
    @InjectRepository(ChatMessage)
    private messageRepo: Repository<ChatMessage>,
    @InjectRepository(Customer)
    private customerRepo: Repository<Customer>,
    @InjectRepository(CustomerDocument)
    private documentRepo: Repository<CustomerDocument>,
    private configService: ConfigService,
  ) {}

  async createSession(dto: CreateSessionDto) {
    // Find customer by openid
    const customer = await this.customerRepo.findOne({ where: { wxOpenid: dto.openid } });

    let customerId: number;
    if (customer) {
      customerId = customer.id;
    } else {
      // Create a placeholder customer record
      const newCustomer = this.customerRepo.create({
        name: '待绑定客户',
        wxOpenid: dto.openid,
        institutionId: 1, // Default institution
        advisorId: 1, // Default advisor
      });
      const saved = await this.customerRepo.save(newCustomer);
      customerId = saved.id;
    }

    const session = this.sessionRepo.create({
      customerId,
      source: (dto.source as any) || 'c_end',
    });

    const saved = await this.sessionRepo.save(session);

    // Add welcome message
    const welcome = this.messageRepo.create({
      sessionId: saved.id,
      role: 'assistant',
      content: '您好！我是韬纪元AI助贷助手。请告诉我您的融资需求，我来为您提供参考建议。请注意：AI提供的信息仅供参考，不构成贷款承诺，最终以银行审核为准。',
    });
    await this.messageRepo.save(welcome);

    return { session: saved, welcomeMessage: welcome };
  }

  async sendMessage(dto: SendMessageDto, openid?: string) {
    const session = await this.sessionRepo.findOne({ where: { id: dto.sessionId } });
    if (!session) throw new NotFoundException('Session not found');

    // Save user message
    const userMessage = await this.messageRepo.save(
      this.messageRepo.create({
        sessionId: dto.sessionId,
        role: 'user',
        content: dto.content,
      }),
    );

    // Get message history for context
    const history = await this.messageRepo.find({
      where: { sessionId: dto.sessionId },
      order: { createdAt: 'ASC' },
      take: 10,
    });

    // Call AI API
    const aiResponse = await this.callAiApi(dto.content, history);

    // Save AI response
    const aiMessage = await this.messageRepo.save(
      this.messageRepo.create({
        sessionId: dto.sessionId,
        role: 'assistant',
        content: aiResponse,
      }),
    );

    return {
      userMessage,
      aiMessage,
    };
  }

  async getProgress(openid: string) {
    const customer = await this.customerRepo.findOne({ where: { wxOpenid: openid } });
    if (!customer) {
      return { found: false, message: 'No customer record found for this account' };
    }

    const documents = await this.documentRepo.find({ where: { customerId: customer.id } });

    return {
      found: true,
      customer: {
        id: customer.id,
        name: customer.name,
        status: customer.status,
        docCompleteness: customer.docCompleteness,
      },
      documentCount: documents.length,
      aiSummary: customer.aiSummary,
    };
  }

  async getHistory(sessionId: number) {
    const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Session not found');

    return this.messageRepo.find({
      where: { sessionId },
      order: { createdAt: 'ASC' },
    });
  }

  private async callAiApi(userMessage: string, history: ChatMessage[]): Promise<string> {
    const apiKey = this.configService.get<string>('AI_API_KEY');
    const baseUrl = this.configService.get<string>('AI_BASE_URL', 'https://api.openai.com/v1');

    if (!apiKey) {
      // Mock response for development
      this.logger.warn('AI_API_KEY not configured, returning mock response');
      return this.getMockResponse(userMessage);
    }

    try {
      const messages = [
        {
          role: 'system',
          content: `你是韬纪元AI助贷助手，帮助客户了解贷款流程和所需资料。注意：你不能承诺贷款额度或通过率，所有信息仅供参考。请用中文回复。`,
        },
        ...history.slice(-8).map((m) => ({ role: m.role, content: m.content })),
        { role: 'user', content: userMessage },
      ];

      const response = await axios.post(
        `${baseUrl}/chat/completions`,
        {
          model: 'gpt-4',
          messages,
          max_tokens: 500,
          temperature: 0.7,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        },
      );

      return response.data.choices[0].message.content;
    } catch (err) {
      this.logger.error(`AI API call failed: ${err.message}`);
      return this.getMockResponse(userMessage);
    }
  }

  private getMockResponse(userMessage: string): string {
    const responses = [
      '感谢您的咨询！一般企业贷款需要准备：营业执照、近6个月银行流水、税务申报记录、法人身份证等材料。请注意AI建议仅供参考，具体以银行要求为准。',
      '根据您描述的情况，建议您准备完整的资料后，由我们的顾问为您分析最适合的产品方向。目前我们合作的银行提供多种企业融资方案，但具体额度和条件需要顾问与银行沟通确认。',
      '我明白您的需求。我们的流程是：1. 您上传资料 2. AI辅助分析 3. 顾问复核 4. 推荐匹配方案。所有AI分析结果均需顾问人工确认，不代表银行最终决定。',
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
}
