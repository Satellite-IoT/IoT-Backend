import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DevicesService } from '../devices/devices.service';
import { PqcGatewayStatusDto } from './dto';

@ApiTags('pqc-gateway')
@Controller('pqcGateway')
export class PqcGatewayController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post('status_ind')
  @ApiOperation({ summary: 'Update status of PQC Gateway' })
  @ApiResponse({ status: 200, description: 'Status updated successfully.' })
  async updatePqcGatewayStatus(@Body() statusData: PqcGatewayStatusDto) {
    console.log('pqc-gateway-status', statusData);
    // await this.devicesService.updateDevicesStatus(statusData);
    return { success: true, message: 'Status updated successfully' };
  }
}
