import { IsString, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: '13800000000' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'Admin123' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 100)
  password: string;
}
