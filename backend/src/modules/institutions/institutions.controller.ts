import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InstitutionsService } from './institutions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Institutions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('institution')
export class InstitutionsController {
  constructor(private readonly institutionsService: InstitutionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get current institution info' })
  getMyInstitution(@CurrentUser() user: any) {
    return this.institutionsService.findById(user.institutionId);
  }
}
