import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WxLoginDto {
  @ApiProperty({ description: 'WeChat login code from wx.login()' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({ description: 'Customer ID if binding as C-end user' })
  @IsOptional()
  customerId?: number;
}
