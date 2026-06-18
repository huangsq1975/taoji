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
import { ReportsService } from './reports.service';
import { CreateReportTaskDto } from './dto/create-report-task.dto';
import { UpdateFieldDto } from './dto/update-field.dto';
import { QueryReportTasksDto } from './dto/query-report-tasks.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('report-tasks')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @ApiOperation({ summary: 'List report tasks' })
  findAll(@CurrentUser() user: any, @Query() query: QueryReportTasksDto) {
    return this.reportsService.findAll(
      user.institutionId,
      user.sub,
      user.dataScope,
      query,
    );
  }

  @Post()
  @ApiOperation({ summary: 'Create AI fill task' })
  create(@CurrentUser() user: any, @Body() dto: CreateReportTaskDto) {
    return this.reportsService.create(user.institutionId, user.sub, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get report task detail with field drafts' })
  findOne(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.reportsService.findOne(id, user.institutionId);
  }

  @Put(':id/fields/:fieldId')
  @ApiOperation({ summary: 'Advisor updates/reviews a field' })
  updateField(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) taskId: number,
    @Param('fieldId', ParseIntPipe) fieldId: number,
    @Body() dto: UpdateFieldDto,
  ) {
    return this.reportsService.updateField(taskId, fieldId, user.institutionId, user.sub, dto);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Advisor approves all fields (mark review_done)' })
  approve(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.reportsService.approve(id, user.institutionId, user.sub);
  }

  @Post(':id/export')
  @ApiOperation({ summary: 'Export material ZIP package' })
  export(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.reportsService.export(id, user.institutionId, user.sub);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Mark report task as submitted to bank' })
  submit(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.reportsService.submit(id, user.institutionId, user.sub);
  }
}
