import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSessionDto {
  @ApiProperty({ description: 'WeChat openid of the customer' })
  @IsString()
  @IsNotEmpty()
  openid: string;

  @ApiPropertyOptional({ description: 'Session source' })
  @IsOptional()
  @IsString()
  source?: string;
}

export class SendMessageDto {
  @ApiProperty({ description: 'Session ID' })
  @Type(() => Number)
  @IsNumber()
  sessionId: number;

  @ApiProperty({ description: 'User message' })
  @IsString()
  @IsNotEmpty()
  content: string;
}
