import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MembershipsService } from './memberships.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Memberships')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Get('membership-plans')
  @ApiOperation({ summary: 'List all membership plans' })
  getPlans() {
    return this.membershipsService.getPlans();
  }

  @Get('institution/subscription')
  @ApiOperation({ summary: 'Get current institution subscription and quota' })
  getSubscription(@CurrentUser() user: any) {
    return this.membershipsService.getSubscription(user.institutionId);
  }

  @Post('institution/upgrade-request')
  @ApiOperation({ summary: 'Submit upgrade request' })
  submitUpgradeRequest(
    @CurrentUser() user: any,
    @Body('planId') planId: number,
  ) {
    return this.membershipsService.submitUpgradeRequest(user.institutionId, planId, user.sub);
  }

  @Get('call-records')
  @ApiOperation({ summary: 'Get call records (quota consumption log)' })
  getCallRecords(@CurrentUser() user: any, @Query() pagination: PaginationDto) {
    return this.membershipsService.getCallRecords(user.institutionId, pagination);
  }
}
