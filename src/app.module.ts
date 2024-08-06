import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DevicesController } from './devices/devices.controller';
import { DevicesService } from './devices/devices.service';

@Module({
  imports: [],
  controllers: [AppController, DevicesController],
  providers: [AppService, DevicesService],
})
export class AppModule {}
