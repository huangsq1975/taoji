import { IsNumber, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReportTaskDto {
  @ApiProperty({ description: 'Customer ID' })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  customerId: number;

  @ApiProperty({ description: 'Bank product ID' })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  productId: number;
}
