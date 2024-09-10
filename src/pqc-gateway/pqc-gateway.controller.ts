import { Controller, Post, Body, HttpException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { mapErrorCodeToHttpStatus } from 'src/common/utils/error-handler.util';
import { createApiResponse } from 'src/common/utils/response.util';
import { DevicesService } from '../devices/devices.service';
import {
  PqcGatewayStatusDto,
  PqcGatewaySuccessResponseDto,
  PqcGatewayErrorResponseDto,
  PqcGatewayAuthenticationErrorDto,
  PqcGatewayNotFoundErrorDto,
} from './dto';

@ApiTags('pqc-gateway')
@Controller('pqcGateway')
export class PqcGatewayController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post('status_ind')
  @ApiOperation({ summary: 'Update status of PQC Gateway' })
  @ApiBody({ type: PqcGatewayStatusDto })
  @ApiResponse({
    status: 201,
    description: 'Status updated successfully.',
    type: PqcGatewaySuccessResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: PqcGatewayAuthenticationErrorDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found',
    type: PqcGatewayNotFoundErrorDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error',
    type: PqcGatewayErrorResponseDto,
  })
  async updatePqcGatewayStatus(@Body() statusData: PqcGatewayStatusDto) {
    console.log('pqc-gateway-status', statusData);
    const result = await this.devicesService.updateDevicesStatus(statusData);
    if (result.success) {
      return {
        result: 'success',
        deviceCtrl: result.data.deviceCtrl,
      };
    } else {
      throw new HttpException(
        {
          result: 'error',
          message: result.message,
          error: result.errorCode,
        },
        mapErrorCodeToHttpStatus(result.errorCode),
      );
    }
  }
}
