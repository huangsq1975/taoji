import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';

// Entities
import { Institution } from './modules/institutions/institution.entity';
import { User } from './modules/users/user.entity';
import { UserPermission } from './modules/users/user-permission.entity';
import { Customer } from './modules/customers/customer.entity';
import { CustomerLabel } from './modules/customers/customer-label.entity';
import { FollowUpRecord } from './modules/customers/follow-up-record.entity';
import { CustomerAuthorization } from './modules/customers/customer-authorization.entity';
import { CustomerDocument } from './modules/documents/customer-document.entity';
import { AiRecognitionResult } from './modules/documents/ai-recognition-result.entity';
import { AiRecognitionTask } from './modules/documents/ai-recognition-task.entity';
import { Bank } from './modules/banks/bank.entity';
import { BankProduct } from './modules/banks/bank-product.entity';
import { BankMaterialConfig } from './modules/banks/bank-material-config.entity';
import { ReportTask } from './modules/reports/report-task.entity';
import { ReportFieldDraft } from './modules/reports/report-field-draft.entity';
import { MembershipPlan } from './modules/memberships/membership-plan.entity';
import { InstitutionSubscription } from './modules/memberships/institution-subscription.entity';
import { CallRecord } from './modules/memberships/call-record.entity';
import { AiFillRule } from './modules/config/ai-fill-rule.entity';
import { PlatformConfig } from './modules/config/platform-config.entity';
import { ApiKey } from './modules/config/api-key.entity';
import { ChatSession } from './modules/chat/chat-session.entity';
import { ChatMessage } from './modules/chat/chat-message.entity';

// Modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { InstitutionsModule } from './modules/institutions/institutions.module';
import { CustomersModule } from './modules/customers/customers.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { BanksModule } from './modules/banks/banks.module';
import { ReportsModule } from './modules/reports/reports.module';
import { MembershipsModule } from './modules/memberships/memberships.module';
import { AiModule } from './modules/ai/ai.module';
import { AppConfigModule } from './modules/config/config.module';
import { ChatModule } from './modules/chat/chat.module';
import { UploadModule } from './modules/upload/upload.module';

const ALL_ENTITIES = [
  Institution,
  User,
  UserPermission,
  Customer,
  CustomerLabel,
  FollowUpRecord,
  CustomerAuthorization,
  CustomerDocument,
  AiRecognitionResult,
  AiRecognitionTask,
  Bank,
  BankProduct,
  BankMaterialConfig,
  ReportTask,
  ReportFieldDraft,
  MembershipPlan,
  InstitutionSubscription,
  CallRecord,
  AiFillRule,
  PlatformConfig,
  ApiKey,
  ChatSession,
  ChatMessage,
];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.example'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DATABASE_HOST', 'localhost'),
        port: config.get<number>('DATABASE_PORT', 5432),
        username: config.get<string>('DATABASE_USER', 'taoji'),
        password: config.get<string>('DATABASE_PASS', 'taoji123'),
        database: config.get<string>('DATABASE_NAME', 'taoji_db'),
        entities: ALL_ENTITIES,
        synchronize: false, // Use migrations in production
        autoLoadEntities: false,
        logging: config.get<string>('NODE_ENV') === 'development',
        ssl: config.get<string>('DATABASE_SSL') === 'true'
          ? { rejectUnauthorized: false }
          : false,
      }),
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
        },
      }),
    }),
    AuthModule,
    UsersModule,
    InstitutionsModule,
    CustomersModule,
    DocumentsModule,
    BanksModule,
    ReportsModule,
    MembershipsModule,
    AiModule,
    AppConfigModule,
    ChatModule,
    UploadModule,
  ],
})
export class AppModule {}
