import { IsArray, IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DataScope } from '../user.entity';

export class UpdatePermissionsDto {
  @ApiProperty({ type: [String], description: 'List of permission keys' })
  @IsArray()
  @IsString({ each: true })
  permissions: string[];

  @ApiPropertyOptional({ enum: DataScope })
  @IsOptional()
  @IsEnum(DataScope)
  dataScope?: DataScope;
}
