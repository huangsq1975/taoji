import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, Length } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CustomerStatus } from '../customer.entity';

export class CreateCustomerDto {
  @ApiProperty({ example: '北京某某科技有限公司' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  financingNeed?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  loanAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  loanPurpose?: string;

  @ApiPropertyOptional({ description: 'Assign to specific advisor, defaults to current user' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  advisorId?: number;
}
