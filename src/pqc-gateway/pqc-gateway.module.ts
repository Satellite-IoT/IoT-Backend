import { Module } from '@nestjs/common';
import { PqcGatewayController } from './pqc-gateway.controller';
import { PqcGatewayService } from './pqc-gateway.service';

@Module({
  controllers: [PqcGatewayController],
  providers: [PqcGatewayService],
})
export class PqcGatewayModule {}
