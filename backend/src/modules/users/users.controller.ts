import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePermissionsDto } from './dto/update-permissions.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UserRole } from './user.entity';

@ApiTags('Institution Members')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('institution')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('members')
  @ApiOperation({ summary: 'List institution members' })
  findMembers(
    @CurrentUser('institutionId') institutionId: number,
    @Query() pagination: PaginationDto,
  ) {
    return this.usersService.findMembers(institutionId, pagination);
  }

  @Post('members')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Create institution member' })
  createMember(
    @CurrentUser('institutionId') institutionId: number,
    @Body() dto: CreateUserDto,
  ) {
    return this.usersService.createMember(institutionId, dto);
  }

  @Put('members/:id/permissions')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Update member permissions' })
  updatePermissions(
    @CurrentUser('institutionId') institutionId: number,
    @Param('id', ParseIntPipe) userId: number,
    @Body() dto: UpdatePermissionsDto,
  ) {
    return this.usersService.updatePermissions(institutionId, userId, dto);
  }

  @Put('members/:id/status')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Enable/disable member account' })
  updateStatus(
    @CurrentUser('institutionId') institutionId: number,
    @Param('id', ParseIntPipe) userId: number,
    @Body('status', ParseIntPipe) status: number,
  ) {
    return this.usersService.updateStatus(institutionId, userId, status);
  }
}
