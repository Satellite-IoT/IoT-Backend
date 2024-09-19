import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PqcGatewayController } from './pqc-gateway.controller';
import { PqcGatewayService } from './pqc-gateway.service';
import { DevicesModule } from 'src/devices/devices.module';
import { Device, Event } from 'src/entities';
import { EventsService } from 'src/events/events.service';

@Module({
  imports: [TypeOrmModule.forFeature([Device, Event]), DevicesModule],
  controllers: [PqcGatewayController],
  providers: [PqcGatewayService, EventsService],
})
export class PqcGatewayModule {}
