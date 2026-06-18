import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { CreateSessionDto, SendMessageDto } from './dto/chat.dto';
import { DocumentsService } from '../documents/documents.service';
import { UploadDocumentDto } from '../documents/dto/upload-document.dto';
import { Public } from '../../common/guards/jwt-auth.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('C-End (Customer)')
@Controller('c')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly documentsService: DocumentsService,
  ) {}

  @Public()
  @Post('session')
  @ApiOperation({ summary: 'Create/restore chat session for C-end customer' })
  createSession(@Body() dto: CreateSessionDto) {
    return this.chatService.createSession(dto);
  }

  @Public()
  @Post('chat')
  @ApiOperation({ summary: 'Send message and get AI reply' })
  sendMessage(@Body() dto: SendMessageDto) {
    return this.chatService.sendMessage(dto);
  }

  @Public()
  @Get('progress')
  @ApiOperation({ summary: 'Get customer progress by openid' })
  getProgress(@Query('openid') openid: string) {
    return this.chatService.getProgress(openid);
  }

  @Public()
  @Get('history/:sessionId')
  @ApiOperation({ summary: 'Get chat history for a session' })
  getHistory(@Param('sessionId', ParseIntPipe) sessionId: number) {
    return this.chatService.getHistory(sessionId);
  }

  @Public()
  @Post('documents/upload')
  @ApiOperation({ summary: 'C-end customer upload document' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadDocumentDto,
    @Body('openid') openid: string,
  ) {
    // For C-end, institutionId=1 and uploaderId is customer (0)
    return this.documentsService.uploadDocument(file, dto, 1, 0, 'customer');
  }
}
