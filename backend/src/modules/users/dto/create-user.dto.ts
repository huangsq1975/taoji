import { IsString, IsNotEmpty, IsEnum, IsOptional, Length, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, DataScope } from '../user.entity';

export class CreateUserDto {
  @ApiProperty({ example: '张三' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  name: string;

  @ApiProperty({ example: '13812345678' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^1[3-9]\d{9}$/, { message: 'Invalid phone number' })
  phone: string;

  @ApiProperty({ example: 'Password123' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 100)
  password: string;

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.ADVISOR })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ enum: DataScope, default: DataScope.SELF })
  @IsOptional()
  @IsEnum(DataScope)
  dataScope?: DataScope;
}
