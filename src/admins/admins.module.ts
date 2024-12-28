import { Module } from '@nestjs/common';
import { AdminsController } from './admins.controller';
import { AdminsService } from './admins.service';
import { LoggerModule } from 'src/logger/logger.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admin } from 'src/entities';


@Module({
  imports: [TypeOrmModule.forFeature([Admin]), LoggerModule],
  providers: [AdminsService],
  controllers: [AdminsController],
  exports: [AdminsService],
})
export class AdminsModule {}
