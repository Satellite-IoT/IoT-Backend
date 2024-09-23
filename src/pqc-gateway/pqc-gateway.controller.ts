import { Controller, Post, Body, HttpException, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery } from '@nestjs/swagger';
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
  GetPqcGatewayAlarmsDto,
} from './dto';
import { AlarmStatus, AlarmType } from 'src/common/enums';

@ApiTags('pqc-gateway')
@Controller('pqcGateway')
export class PqcGatewayController {
  constructor(private readonly pqcGatewayService: PqcGatewayService) {}

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
        updatedAlarms: result.data.updatedAlarms,
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

  @Get('alarms')
  @ApiOperation({ summary: 'Get PQC Gateway alarms with pagination, filtering, and sorting' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'alarmType', required: false, enum: AlarmType })
  @ApiQuery({ name: 'alarmStatus', required: false, enum: AlarmStatus })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @ApiResponse({ status: 200, description: 'Alarms retrieved successfully.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async getPqcGatewayAlarms(@Query() getPqcGatewayAlarmsDto: GetPqcGatewayAlarmsDto) {
    const result = await this.pqcGatewayService.getAlarms(getPqcGatewayAlarmsDto);

    if (result.success) {
      return result.data;
    } else {
      throw new HttpException(
        { message: result.message, error: result.errorCode },
        mapErrorCodeToHttpStatus(result.errorCode),
      );
    }
  }
}
