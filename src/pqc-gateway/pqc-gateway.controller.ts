import {
  Controller,
  Post,
  Body,
  HttpException,
  Get,
  Query,
  ClassSerializerInterceptor,
  UseInterceptors,
} from '@nestjs/common';
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
import { LoggerService } from 'src/logger/logger.service';

@ApiTags('pqc-gateway')
@Controller('pqcGateway')
@UseInterceptors(ClassSerializerInterceptor)
export class PqcGatewayController {
  constructor(
    private readonly pqcGatewayService: PqcGatewayService,
    private readonly logger: LoggerService,
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
    this.logger.log(
      'Attempting to update PQC Gateway status',
      'PqcGatewayController - updatePqcGatewayStatus',
      statusData,
    );

    const result = await this.pqcGatewayService.updateDevicesStatus(statusData);
    if (result.success) {
      this.logger.log('PQC Gateway status updated successfully', 'PqcGatewayController', statusData);
      return {
        result: 'success',
        deviceCtrl: result.data.deviceCtrl,
      };
    } else {
      this.logger.error(
        'Failed to update PQC Gateway status',
        result.message,
        'PqcGatewayController - updatePqcGatewayStatus',
        statusData,
      );
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
    this.logger.log(
      'Attempting to update PQC Gateway alarm',
      'PqcGatewayController - updatePqcGatewayAlarm',
      alarmData,
    );

    const result = await this.pqcGatewayService.updatePqcGatewayAlarm(alarmData);
    if (result.success) {
      this.logger.log('PQC Gateway alarm updated successfully', 'PqcGatewayController', result.data);
      return {
        result: 'success',
        message: result.message,
        updatedAlarms: result.data.updatedAlarms,
      };
    } else {
      this.logger.error(
        'Failed to update PQC Gateway alarm',
        result.message,
        'PqcGatewayController - updatePqcGatewayAlarm',
        alarmData,
      );
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
  @ApiQuery({ name: 'startDate', required: false, type: Date, description: 'Start date (ISO 8601 format)' })
  @ApiQuery({ name: 'endDate', required: false, type: Date, description: 'End date (ISO 8601 format)' })
  @ApiQuery({
    name: 'startTimestamp',
    required: false,
    type: Number,
    description: 'Start timestamp (Unix timestamp in milliseconds)',
  })
  @ApiQuery({
    name: 'endTimestamp',
    required: false,
    type: Number,
    description: 'End timestamp (Unix timestamp in milliseconds)',
  })
  @ApiResponse({ status: 200, description: 'Alarms retrieved successfully.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async getPqcGatewayAlarms(@Query() getPqcGatewayAlarmsDto: GetPqcGatewayAlarmsDto) {
    this.logger.log(
      'Fetching PQC Gateway alarms',
      'PqcGatewayController - getPqcGatewayAlarms',
      getPqcGatewayAlarmsDto,
    );

    const result = await this.pqcGatewayService.getAlarms(getPqcGatewayAlarmsDto);

    if (result.success) {
      this.logger.log(
        'Successfully retrieved PQC Gateway alarms',
        'PqcGatewayController - getPqcGatewayAlarms',
        result.data,
      );
      return result.data;
    } else {
      this.logger.error(
        'Failed to retrieve PQC Gateway alarms',
        result.message,
        'PqcGatewayController - getPqcGatewayAlarms',
        getPqcGatewayAlarmsDto,
      );
      throw new HttpException(
        { message: result.message, error: result.errorCode },
        mapErrorCodeToHttpStatus(result.errorCode),
      );
    }
  }
}
