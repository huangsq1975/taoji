import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigController } from './config.controller';
import { AppConfigService } from './config.service';
import { AiFillRule } from './ai-fill-rule.entity';
import { PlatformConfig } from './platform-config.entity';
import { ApiKey } from './api-key.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AiFillRule, PlatformConfig, ApiKey])],
  controllers: [ConfigController],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}
