import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AppConfigService, CreateAiFillRuleDto, UpdateAiFillRuleDto } from './config.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../users/user.entity';

@ApiTags('Config')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ConfigController {
  constructor(private readonly configService: AppConfigService) {}

  @Get('ai-fill-rules')
  @ApiOperation({ summary: 'List AI fill rules' })
  findAllRules(@CurrentUser() user: any) {
    return this.configService.findAllRules(user.institutionId);
  }

  @Post('ai-fill-rules')
  @ApiOperation({ summary: 'Create AI fill rule' })
  createRule(@CurrentUser() user: any, @Body() dto: CreateAiFillRuleDto) {
    return this.configService.createRule(user.institutionId, user.sub, dto);
  }

  @Put('ai-fill-rules/:id')
  @ApiOperation({ summary: 'Update AI fill rule' })
  updateRule(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAiFillRuleDto,
  ) {
    return this.configService.updateRule(id, user.institutionId, dto);
  }

  @Delete('ai-fill-rules/:id')
  @ApiOperation({ summary: 'Delete AI fill rule' })
  deleteRule(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.configService.deleteRule(id, user.institutionId);
  }

  @Get('platform-configs')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all platform configs (admin only)' })
  getPlatformConfigs() {
    return this.configService.getPlatformConfigs();
  }

  @Put('platform-configs/:key')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Set platform config value (admin only)' })
  setPlatformConfig(
    @Param('key') key: string,
    @Body('value') value: string,
  ) {
    return this.configService.setPlatformConfig(key, value);
  }

  @Get('api-keys')
  @ApiOperation({ summary: 'List institution API keys' })
  getApiKeys(@CurrentUser() user: any) {
    return this.configService.getApiKeys(user.institutionId);
  }

  @Post('api-keys')
  @ApiOperation({ summary: 'Create a new API key' })
  createApiKey(@CurrentUser() user: any, @Body('name') name: string) {
    return this.configService.createApiKey(user.institutionId, name);
  }

  @Delete('api-keys/:id')
  @ApiOperation({ summary: 'Revoke an API key' })
  revokeApiKey(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.configService.revokeApiKey(user.institutionId, id);
  }
}
