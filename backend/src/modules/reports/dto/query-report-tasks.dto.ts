import { IsOptional, IsEnum, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { ReportTaskStatus } from '../report-task.entity';

export class QueryReportTasksDto extends PaginationDto {
  @ApiPropertyOptional({ enum: ReportTaskStatus })
  @IsOptional()
  @IsEnum(ReportTaskStatus)
  status?: ReportTaskStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  customerId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  advisorId?: number;
}
