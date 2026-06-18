import { IsNumber, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocType } from '../customer-document.entity';

export class UploadDocumentDto {
  @ApiProperty({ description: 'Customer ID' })
  @Type(() => Number)
  @IsNumber()
  customerId: number;

  @ApiProperty({ enum: DocType })
  @IsEnum(DocType)
  docType: DocType;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  uploaderId?: number;
}
