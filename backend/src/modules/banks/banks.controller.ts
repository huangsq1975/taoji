import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BanksService } from './banks.service';
import { CreateBankDto, UpdateBankDto } from './dto/create-bank.dto';
import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';
import { CreateMaterialConfigDto, UpdateMaterialConfigDto } from './dto/create-material-config.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';

@ApiTags('Banks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class BanksController {
  constructor(private readonly banksService: BanksService) {}

  // ---- Banks ----

  @Get('banks')
  @ApiOperation({ summary: 'List all active banks' })
  findAllBanks() {
    return this.banksService.findAllBanks();
  }

  @Post('banks')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a bank (admin only)' })
  createBank(@Body() dto: CreateBankDto) {
    return this.banksService.createBank(dto);
  }

  @Put('banks/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a bank (admin only)' })
  updateBank(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBankDto) {
    return this.banksService.updateBank(id, dto);
  }

  @Delete('banks/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a bank (admin only)' })
  deleteBank(@Param('id', ParseIntPipe) id: number) {
    return this.banksService.deleteBank(id);
  }

  // ---- Bank Products ----

  @Get('banks/:id/products')
  @ApiOperation({ summary: 'Get products for a bank' })
  findProductsByBank(@Param('id', ParseIntPipe) bankId: number) {
    return this.banksService.findProductsByBank(bankId);
  }

  @Post('banks/:id/products')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Add product to bank (admin only)' })
  createProduct(@Param('id', ParseIntPipe) bankId: number, @Body() dto: CreateProductDto) {
    return this.banksService.createProduct(bankId, dto);
  }

  @Put('bank-products/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a bank product (admin only)' })
  updateProduct(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductDto) {
    return this.banksService.updateProduct(id, dto);
  }

  @Delete('bank-products/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a bank product (admin only)' })
  deleteProduct(@Param('id', ParseIntPipe) id: number) {
    return this.banksService.deleteProduct(id);
  }

  // ---- Material Configs ----

  @Get('bank-products/:id/material-config')
  @ApiOperation({ summary: 'Get material field config for a product' })
  getMaterialConfig(@Param('id', ParseIntPipe) productId: number) {
    return this.banksService.getMaterialConfig(productId);
  }

  @Post('bank-products/:id/material-config')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Add material field config (admin only)' })
  createMaterialConfig(
    @Param('id', ParseIntPipe) productId: number,
    @Body() dto: CreateMaterialConfigDto,
  ) {
    return this.banksService.createMaterialConfig(productId, dto);
  }

  @Put('bank-material-configs/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update material config (admin only)' })
  updateMaterialConfig(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMaterialConfigDto,
  ) {
    return this.banksService.updateMaterialConfig(id, dto);
  }

  @Delete('bank-material-configs/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete material config (admin only)' })
  deleteMaterialConfig(@Param('id', ParseIntPipe) id: number) {
    return this.banksService.deleteMaterialConfig(id);
  }
}
