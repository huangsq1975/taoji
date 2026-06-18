import { IsOptional, IsString, IsEnum, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { CustomerStatus } from '../customer.entity';

export class QueryCustomersDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search by name or contact phone' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ enum: CustomerStatus })
  @IsOptional()
  @IsEnum(CustomerStatus)
  status?: CustomerStatus;

  @ApiPropertyOptional({ description: 'Filter by advisor ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  advisorId?: number;
}
