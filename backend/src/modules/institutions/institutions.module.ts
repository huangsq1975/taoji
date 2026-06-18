import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InstitutionsController } from './institutions.controller';
import { InstitutionsService } from './institutions.service';
import { Institution } from './institution.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Institution])],
  controllers: [InstitutionsController],
  providers: [InstitutionsService],
  exports: [InstitutionsService, TypeOrmModule],
})
export class InstitutionsModule {}
