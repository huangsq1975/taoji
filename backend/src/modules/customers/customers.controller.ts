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
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomersDto } from './dto/query-customers.dto';
import { CreateFollowUpDto } from './dto/create-follow-up.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { DocumentsService } from '../documents/documents.service';

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('customers')
export class CustomersController {
  constructor(
    private readonly customersService: CustomersService,
    private readonly documentsService: DocumentsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List customers with search/filter/pagination' })
  findAll(@CurrentUser() user: any, @Query() query: QueryCustomersDto) {
    return this.customersService.findAll(
      user.institutionId,
      user.sub,
      user.dataScope,
      query,
    );
  }

  @Post()
  @ApiOperation({ summary: 'Create a new customer' })
  create(@CurrentUser() user: any, @Body() dto: CreateCustomerDto) {
    return this.customersService.create(user.institutionId, user.sub, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer detail' })
  findOne(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.customersService.findOne(user.institutionId, user.sub, user.dataScope, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update customer info' })
  update(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customersService.update(user.institutionId, user.sub, user.dataScope, id, dto);
  }

  @Get(':id/overview')
  @ApiOperation({ summary: '360 portrait overview' })
  getOverview(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.customersService.getOverview(user.institutionId, user.sub, user.dataScope, id);
  }

  @Get(':id/documents')
  @ApiOperation({ summary: 'Get customer documents' })
  getDocuments(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.customersService.getDocuments(user.institutionId, user.sub, user.dataScope, id);
  }

  @Get(':id/follow-ups')
  @ApiOperation({ summary: 'Get follow-up timeline' })
  getFollowUps(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.customersService.getFollowUps(user.institutionId, user.sub, user.dataScope, id);
  }

  @Post(':id/follow-ups')
  @ApiOperation({ summary: 'Add follow-up record' })
  addFollowUp(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateFollowUpDto,
  ) {
    return this.customersService.addFollowUp(user.institutionId, user.sub, user.dataScope, id, dto);
  }

  @Get(':id/report-tasks')
  @ApiOperation({ summary: 'Get report tasks for customer' })
  getReportTasks(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.customersService.getReportTasks(user.institutionId, user.sub, user.dataScope, id);
  }

  @Get(':id/recognition-summary')
  @ApiOperation({ summary: 'Get AI recognition summary and gap analysis for customer' })
  getRecognitionSummary(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.documentsService.getRecognitionSummary(user.institutionId, id);
  }
}
