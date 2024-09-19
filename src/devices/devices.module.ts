import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';
import { Device, Event } from 'src/entities';
import { CryptoService } from './crypto.service';
import { EventsService } from 'src/events/events.service';

@Module({
  imports: [TypeOrmModule.forFeature([Device, Event])],
  controllers: [DevicesController],
  providers: [DevicesService, CryptoService, EventsService],
  exports: [DevicesService],
})
export class DevicesModule {}
