import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateFieldDto {
  @ApiProperty({ description: 'Final value set by advisor' })
  @IsString()
  finalValue: string;

  @ApiPropertyOptional({ enum: ['pending', 'approved', 'corrected', 'rejected'] })
  @IsOptional()
  @IsEnum(['pending', 'approved', 'corrected', 'rejected'])
  reviewStatus?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  aiNote?: string;
}
