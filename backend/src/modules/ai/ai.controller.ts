import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AiService, TriggerRecognitionDto } from './ai.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DocumentsService } from '../documents/documents.service';

@ApiTags('AI Recognition')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly documentsService: DocumentsService,
  ) {}

  @Post('recognize')
  @ApiOperation({ summary: 'Trigger AI recognition task (async, returns taskId)' })
  triggerRecognition(@CurrentUser() user: any, @Body() dto: TriggerRecognitionDto) {
    return this.aiService.triggerRecognition(user.institutionId, user.sub, dto);
  }

  @Get('recognize/:taskId')
  @ApiOperation({ summary: 'Poll AI recognition task status' })
  getTaskStatus(
    @CurrentUser() user: any,
    @Param('taskId', ParseIntPipe) taskId: number,
  ) {
    return this.aiService.getTaskStatus(taskId, user.institutionId);
  }
}

// Additional route for customers recognition summary - mounted in documents controller
