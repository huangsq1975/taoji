import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Institution } from './institution.entity';

@Injectable()
export class InstitutionsService {
  constructor(
    @InjectRepository(Institution)
    private institutionRepo: Repository<Institution>,
  ) {}

  async findById(id: number) {
    const institution = await this.institutionRepo.findOne({ where: { id } });
    if (!institution) throw new NotFoundException('Institution not found');
    return institution;
  }

  async findAll() {
    return this.institutionRepo.find({ where: { status: 1 } });
  }

  async create(name: string) {
    const institution = this.institutionRepo.create({ name, status: 1 });
    return this.institutionRepo.save(institution);
  }

  async update(id: number, data: Partial<Institution>) {
    await this.institutionRepo.update(id, data);
    return this.findById(id);
  }

  async resetMonthlyQuota(institutionId: number) {
    const institution = await this.findById(institutionId);
    await this.institutionRepo.update(institutionId, {
      quotaUsed: 0,
      quotaResetAt: new Date(),
    });
    return { success: true };
  }
}
