import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PqcGatewayController } from './pqc-gateway.controller';
import { PqcGatewayService } from './pqc-gateway.service';
import { DevicesModule } from 'src/devices/devices.module';
import { Alarm, Device, Event } from 'src/entities';
import { EventsService } from 'src/events/events.service';

@Module({
  imports: [TypeOrmModule.forFeature([Device, Event, Alarm]), DevicesModule],
  controllers: [PqcGatewayController],
  providers: [PqcGatewayService, EventsService],
})
export class PqcGatewayModule {}
