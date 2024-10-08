import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpStatus,
  HttpException,
  UsePipes,
  ValidationPipe,
  Delete,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { ErrorCode, EventLevel, EventTag, EventType, SortField, SortOrder } from 'src/common/enums';
import { createApiResponse } from '../common/utils/response.util';
import { AuthenticateDeviceDto, GetDeviceListDto, RegisterDeviceDto, UpdateDeviceDto } from './dto';
import { DevicesService } from './devices.service';
import { CryptoService } from './crypto.service';
import { EventsService } from 'src/events/events.service';
import { mapErrorCodeToHttpStatus } from 'src/common/utils/error-handler.util';

@ApiTags('devices')
@Controller('devices')
@UsePipes(new ValidationPipe({ transform: true }))
export class DevicesController {
  constructor(
    private readonly devicesService: DevicesService,
    private readonly cryptoService: CryptoService,
    private readonly eventsService: EventsService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new device' })
  @ApiBody({ type: RegisterDeviceDto })
  @ApiResponse({ status: 201, description: 'The device has been successfully registered.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async register(@Body() registerDeviceDto: RegisterDeviceDto) {
    const result = await this.devicesService.register(registerDeviceDto);
    if (result.success) {
      await this.eventsService.createEvent({
        level: EventLevel.INFO,
        type: EventType.DEVICE_REGISTRATION,
        tag: EventTag.DEVICE,
        message: 'Device registered successfully',
        details: `Device [${registerDeviceDto.deviceId}] has been registered successfully`,
      });

      return createApiResponse({
        success: true,
        message: result.message,
        data: result.data,
      });
    } else {
      await this.eventsService.createEvent({
        level: EventLevel.ERROR,
        type: EventType.DEVICE_REGISTRATION,
        tag: EventTag.DEVICE,
        message: 'Device registration failed',
        details: `Failed to register device [${registerDeviceDto.deviceId}]: ${result.message}`,
      });

      throw new HttpException(
        createApiResponse({
          success: false,
          message: result.message,
          error: result.errorCode,
        }),
        mapErrorCodeToHttpStatus(result.errorCode),
      );
    }
  }

  @Post('authenticate')
  @ApiOperation({ summary: 'Authenticate a device' })
  @ApiBody({ type: AuthenticateDeviceDto })
  @ApiResponse({ status: 200, description: 'The device has been successfully authenticated.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async authenticate(@Body() authenticateDeviceDto: AuthenticateDeviceDto) {
    const result = await this.devicesService.authenticate(authenticateDeviceDto);
    if (result.success) {
      await this.eventsService.createEvent({
        level: EventLevel.INFO,
        type: EventType.DEVICE_AUTHENTICATION,
        tag: EventTag.DEVICE,
        message: 'Device authenticated successfully',
        details: `Device [${authenticateDeviceDto.deviceId}] has been authenticated successfully`,
      });

      return createApiResponse({
        success: true,
        message: result.message,
      });
    } else {
      await this.eventsService.createEvent({
        level: EventLevel.WARNING,
        type: EventType.DEVICE_AUTHENTICATION,
        tag: EventTag.DEVICE,
        message: 'Device authentication failed',
        details: `Failed to authenticate device [${authenticateDeviceDto.deviceId}]: ${result.message}`,
      });

      throw new HttpException(
        createApiResponse({
          success: false,
          message: result.message,
          error: result.errorCode,
        }),
        mapErrorCodeToHttpStatus(result.errorCode),
      );
    }
  }

  @Get('list')
  @ApiOperation({ summary: 'Get a list of devices with pagination, filtering, and sorting' })
  @ApiResponse({ status: 200, description: 'Returns the list of devices.' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'includePqcGateway', required: false, type: Boolean })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, type: String })
  async getDeviceList(@Query() getDeviceListDto: GetDeviceListDto) {
    const result = await this.devicesService.getDeviceList(getDeviceListDto);
    if (result.success) {
      return createApiResponse({
        success: true,
        message: result.message,
        data: result.data,
      });
    } else {
      throw new HttpException(
        createApiResponse({
          success: false,
          message: result.message,
          error: result.errorCode,
        }),
        mapErrorCodeToHttpStatus(result.errorCode),
      );
    }
  }

  @Get('id/:id')
  @ApiOperation({ summary: 'Get a device by ID' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Returns the device information.' })
  @ApiResponse({ status: 404, description: 'Device not found.' })
  async getDeviceById(@Param('id') id: string) {
    const result = await this.devicesService.getDeviceById(+id);
    if (result.success) {
      return createApiResponse({
        success: true,
        message: result.message,
        data: result.data,
      });
    } else {
      throw new HttpException(
        createApiResponse({
          success: false,
          message: result.message,
          error: result.errorCode,
        }),
        mapErrorCodeToHttpStatus(result.errorCode),
      );
    }
  }

  @Get(':deviceId')
  @ApiOperation({ summary: 'Get a device by device ID' })
  @ApiParam({ name: 'deviceId', type: 'string' })
  @ApiResponse({ status: 200, description: 'Returns the device information.' })
  @ApiResponse({ status: 404, description: 'Device not found.' })
  async getDeviceByDeviceId(@Param('deviceId') deviceId: string) {
    const result = await this.devicesService.getDeviceByDeviceId(deviceId);
    if (result.success) {
      return createApiResponse({
        success: true,
        message: result.message,
        data: result.data,
      });
    } else {
      throw new HttpException(
        createApiResponse({
          success: false,
          message: result.message,
          error: result.errorCode,
        }),
        mapErrorCodeToHttpStatus(result.errorCode),
      );
    }
  }

  @Patch(':deviceId')
  @ApiOperation({ summary: 'Update a device by device ID' })
  @ApiParam({ name: 'deviceId', type: 'string' })
  @ApiBody({ type: UpdateDeviceDto })
  @ApiResponse({ status: 200, description: 'The device has been successfully updated.' })
  @ApiResponse({ status: 404, description: 'Device not found.' })
  async updateDevice(@Param('deviceId') deviceId: string, @Body() updateDeviceDto: UpdateDeviceDto) {
    const result = await this.devicesService.updateDevice(deviceId, updateDeviceDto);
    if (result.success) {
      return createApiResponse({
        success: true,
        message: result.message,
        data: result.data,
      });
    } else {
      throw new HttpException(
        createApiResponse({
          success: false,
          message: result.message,
          error: result.errorCode,
        }),
        mapErrorCodeToHttpStatus(result.errorCode),
      );
    }
  }

  @Delete(':deviceId')
  @ApiOperation({ summary: 'Delete a device by device ID' })
  @ApiParam({ name: 'deviceId', type: 'string' })
  @ApiResponse({ status: 200, description: 'The device has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Device not found.' })
  async deleteDeviceByDeviceId(@Param('deviceId') deviceId: string) {
    const result = await this.devicesService.deleteDeviceByDeviceId(deviceId);
    if (result.success) {
      return createApiResponse({
        success: true,
        message: result.message,
      });
    } else {
      throw new HttpException(
        createApiResponse({
          success: false,
          message: result.message,
          error: result.errorCode,
        }),
        mapErrorCodeToHttpStatus(result.errorCode),
      );
    }
  }
}
