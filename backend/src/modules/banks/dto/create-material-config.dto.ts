import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMaterialConfigDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fieldKey: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fieldLabel: string;

  @ApiPropertyOptional({ enum: ['text', 'number', 'date', 'enum', 'file', 'boolean'], default: 'text' })
  @IsOptional()
  @IsEnum(['text', 'number', 'date', 'enum', 'file', 'boolean'])
  fieldType?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  required?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceHint?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  reviewRequired?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sortOrder?: number;
}

export class UpdateMaterialConfigDto extends CreateMaterialConfigDto {}
