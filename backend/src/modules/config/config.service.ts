import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiFillRule } from './ai-fill-rule.entity';
import { PlatformConfig } from './platform-config.entity';
import { ApiKey } from './api-key.entity';
import * as crypto from 'crypto';

export class CreateAiFillRuleDto {
  name: string;
  scene: string;
  reviewPolicy?: string;
  mappingDesc?: string;
  sortOrder?: number;
}

export class UpdateAiFillRuleDto extends CreateAiFillRuleDto {}

@Injectable()
export class AppConfigService {
  constructor(
    @InjectRepository(AiFillRule)
    private ruleRepo: Repository<AiFillRule>,
    @InjectRepository(PlatformConfig)
    private platformConfigRepo: Repository<PlatformConfig>,
    @InjectRepository(ApiKey)
    private apiKeyRepo: Repository<ApiKey>,
  ) {}

  async findAllRules(institutionId?: number) {
    const qb = this.ruleRepo.createQueryBuilder('r')
      .where('r.status = 1')
      .andWhere('(r.institution_id IS NULL OR r.institution_id = :institutionId)', {
        institutionId: institutionId || 0,
      })
      .orderBy('r.sort_order', 'ASC');

    return qb.getMany();
  }

  async createRule(institutionId: number, userId: number, dto: CreateAiFillRuleDto) {
    const rule = this.ruleRepo.create({
      ...dto,
      institutionId,
      createdBy: userId,
      status: 1,
    });
    return this.ruleRepo.save(rule);
  }

  async updateRule(id: number, institutionId: number, dto: UpdateAiFillRuleDto) {
    const rule = await this.ruleRepo.findOne({
      where: { id },
    });
    if (!rule) throw new NotFoundException('Rule not found');

    await this.ruleRepo.update(id, dto);
    return this.ruleRepo.findOne({ where: { id } });
  }

  async deleteRule(id: number, institutionId: number) {
    const rule = await this.ruleRepo.findOne({ where: { id } });
    if (!rule) throw new NotFoundException('Rule not found');
    await this.ruleRepo.update(id, { status: 0 });
    return { success: true };
  }

  async getPlatformConfigs() {
    return this.platformConfigRepo.find();
  }

  async setPlatformConfig(key: string, value: string) {
    let config = await this.platformConfigRepo.findOne({ where: { configKey: key } });
    if (config) {
      await this.platformConfigRepo.update(config.id, { configVal: value });
    } else {
      config = this.platformConfigRepo.create({ configKey: key, configVal: value });
      await this.platformConfigRepo.save(config);
    }
    return this.platformConfigRepo.findOne({ where: { configKey: key } });
  }

  async getApiKeys(institutionId: number) {
    return this.apiKeyRepo.find({
      where: { institutionId, status: 'active' },
    });
  }

  async createApiKey(institutionId: number, name: string) {
    const rawKey = `tj_${crypto.randomBytes(24).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.substring(0, 10);

    const apiKey = this.apiKeyRepo.create({
      institutionId,
      name,
      keyHash,
      keyPrefix,
      status: 'active',
    });

    await this.apiKeyRepo.save(apiKey);

    // Return raw key only once
    return { ...apiKey, rawKey, message: 'Save this key - it will not be shown again' };
  }

  async revokeApiKey(institutionId: number, id: number) {
    const key = await this.apiKeyRepo.findOne({ where: { id, institutionId } });
    if (!key) throw new NotFoundException('API key not found');
    await this.apiKeyRepo.update(id, { status: 'revoked' });
    return { success: true };
  }
}
