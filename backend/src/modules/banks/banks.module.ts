import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BanksController } from './banks.controller';
import { BanksService } from './banks.service';
import { Bank } from './bank.entity';
import { BankProduct } from './bank-product.entity';
import { BankMaterialConfig } from './bank-material-config.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Bank, BankProduct, BankMaterialConfig])],
  controllers: [BanksController],
  providers: [BanksService],
  exports: [BanksService, TypeOrmModule],
})
export class BanksModule {}
