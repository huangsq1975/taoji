import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatSession } from './chat-session.entity';
import { ChatMessage } from './chat-message.entity';
import { Customer } from '../customers/customer.entity';
import { CustomerDocument } from '../documents/customer-document.entity';
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatSession, ChatMessage, Customer, CustomerDocument]),
    DocumentsModule,
  ],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
