import { Module } from '@nestjs/common';
import { PqcGatewayController } from './pqc-gateway.controller';
import { PqcGatewayService } from './pqc-gateway.service';
import { DevicesModule } from 'src/devices/devices.module';

@Module({
  imports: [DevicesModule],
  controllers: [PqcGatewayController],
  providers: [PqcGatewayService],
})
export class PqcGatewayModule {}
