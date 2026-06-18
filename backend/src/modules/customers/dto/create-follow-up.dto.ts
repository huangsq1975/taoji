import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { FollowUpType } from '../follow-up-record.entity';

export class CreateFollowUpDto {
  @ApiProperty({ enum: FollowUpType })
  @IsEnum(FollowUpType)
  type: FollowUpType;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content: string;
}
