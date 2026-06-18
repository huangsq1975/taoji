import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bank } from './bank.entity';
import { BankProduct } from './bank-product.entity';
import { BankMaterialConfig } from './bank-material-config.entity';
import { CreateBankDto, UpdateBankDto } from './dto/create-bank.dto';
import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';
import { CreateMaterialConfigDto, UpdateMaterialConfigDto } from './dto/create-material-config.dto';

@Injectable()
export class BanksService {
  constructor(
    @InjectRepository(Bank)
    private bankRepo: Repository<Bank>,
    @InjectRepository(BankProduct)
    private productRepo: Repository<BankProduct>,
    @InjectRepository(BankMaterialConfig)
    private materialConfigRepo: Repository<BankMaterialConfig>,
  ) {}

  async findAllBanks() {
    return this.bankRepo.find({
      where: { status: 1 },
      order: { sortOrder: 'ASC', id: 'ASC' },
    });
  }

  async createBank(dto: CreateBankDto) {
    const bank = this.bankRepo.create({ ...dto, status: 1 });
    return this.bankRepo.save(bank);
  }

  async updateBank(id: number, dto: UpdateBankDto) {
    const bank = await this.bankRepo.findOne({ where: { id } });
    if (!bank) throw new NotFoundException('Bank not found');
    await this.bankRepo.update(id, dto);
    return this.bankRepo.findOne({ where: { id } });
  }

  async deleteBank(id: number) {
    const bank = await this.bankRepo.findOne({ where: { id } });
    if (!bank) throw new NotFoundException('Bank not found');
    await this.bankRepo.update(id, { status: 0 });
    return { success: true };
  }

  async findProductsByBank(bankId: number) {
    const bank = await this.bankRepo.findOne({ where: { id: bankId } });
    if (!bank) throw new NotFoundException('Bank not found');

    return this.productRepo.find({
      where: { bankId, status: 1 },
      order: { sortOrder: 'ASC', id: 'ASC' },
    });
  }

  async createProduct(bankId: number, dto: CreateProductDto) {
    const bank = await this.bankRepo.findOne({ where: { id: bankId } });
    if (!bank) throw new NotFoundException('Bank not found');

    const product = this.productRepo.create({ ...dto, bankId, status: 1 });
    return this.productRepo.save(product);
  }

  async updateProduct(id: number, dto: UpdateProductDto) {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    await this.productRepo.update(id, dto);
    return this.productRepo.findOne({ where: { id } });
  }

  async deleteProduct(id: number) {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    await this.productRepo.update(id, { status: 0 });
    return { success: true };
  }

  async getMaterialConfig(productId: number) {
    const product = await this.productRepo.findOne({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');

    const configs = await this.materialConfigRepo.find({
      where: { productId },
      order: { sortOrder: 'ASC', id: 'ASC' },
    });

    return { product, configs };
  }

  async createMaterialConfig(productId: number, dto: CreateMaterialConfigDto) {
    const product = await this.productRepo.findOne({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');

    const config = this.materialConfigRepo.create({ ...dto, productId });
    return this.materialConfigRepo.save(config);
  }

  async updateMaterialConfig(id: number, dto: UpdateMaterialConfigDto) {
    const config = await this.materialConfigRepo.findOne({ where: { id } });
    if (!config) throw new NotFoundException('Material config not found');
    await this.materialConfigRepo.update(id, dto);
    return this.materialConfigRepo.findOne({ where: { id } });
  }

  async deleteMaterialConfig(id: number) {
    const config = await this.materialConfigRepo.findOne({ where: { id } });
    if (!config) throw new NotFoundException('Material config not found');
    await this.materialConfigRepo.delete(id);
    return { success: true };
  }

  async getProductById(id: number) {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }
}
