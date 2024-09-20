import { Controller, Post, Body, HttpException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { mapErrorCodeToHttpStatus } from 'src/common/utils/error-handler.util';
import { createApiResponse } from 'src/common/utils/response.util';
import { EventsService } from 'src/events/events.service';
import { PqcGatewayService } from './pqc-gateway.service';
import {
  PqcGatewayStatusDto,
  PqcGatewayStatusResponseDto,
  PqcGatewayErrorResponseDto,
  PqcGatewayAuthenticationErrorDto,
  PqcGatewayNotFoundErrorDto,
  PqcGatewayAlarmDto,
  PqcGatewayAlarmResponseDto,
} from './dto';

@ApiTags('pqc-gateway')
@Controller('pqcGateway')
export class PqcGatewayController {
  constructor(
    private readonly pqcGatewayService: PqcGatewayService,
  ) {}

  @Post('status_ind')
  @ApiOperation({ summary: 'Update status of PQC Gateway' })
  @ApiBody({ type: PqcGatewayStatusDto })
  @ApiResponse({
    status: 201,
    description: 'Status updated successfully.',
    type: PqcGatewayStatusResponseDto,
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
    const result = await this.pqcGatewayService.updateDevicesStatus(statusData);
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

  @Post('alarm_ind')
  @ApiOperation({ summary: 'Update alarm of PQC Gateway' })
  @ApiBody({ type: PqcGatewayAlarmDto })
  @ApiResponse({
    status: 201,
    description: 'Alarm updated successfully.',
    type: PqcGatewayAlarmResponseDto,
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
  async updatePqcGatewayAlarm(@Body() alarmData: PqcGatewayAlarmDto) {
    const result = await this.pqcGatewayService.updatePqcGatewayAlarm(alarmData);
    if (result.success) {
      return {
        result: 'success',
        message: result.message,
        updatedEvents: result.data.updatedEvents,
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
