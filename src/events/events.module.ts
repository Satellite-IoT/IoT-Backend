import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { Event } from 'src/entities';

@Module({
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}
