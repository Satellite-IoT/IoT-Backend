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
  ClassSerializerInterceptor,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { ErrorCode, EventLevel, EventTag, EventType, SortField, SortOrder } from 'src/common/enums';
import { createApiResponse } from '../common/utils/response.util';
import { AuthenticateDeviceDto, GetDeviceListDto, RegisterDeviceDto, UpdateDeviceDto } from './dto';
import { DevicesService } from './devices.service';
import { CryptoService } from './crypto.service';
import { EventsService } from 'src/events/events.service';
import { mapErrorCodeToHttpStatus } from 'src/common/utils/error-handler.util';
import { LoggerService } from 'src/logger/logger.service';

@ApiTags('devices')
@Controller('devices')
@UsePipes(new ValidationPipe({ transform: true }))
@UseInterceptors(ClassSerializerInterceptor)
export class DevicesController {
  constructor(
    private readonly devicesService: DevicesService,
    private readonly cryptoService: CryptoService,
    private readonly eventsService: EventsService,
    private readonly logger: LoggerService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new device' })
  @ApiBody({ type: RegisterDeviceDto })
  @ApiResponse({ status: 201, description: 'The device has been successfully registered.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async register(@Body() registerDeviceDto: RegisterDeviceDto) {
    this.logger.log('Attempting to register device', 'DevicesController', registerDeviceDto);

    const result = await this.devicesService.register(registerDeviceDto);
    if (result.success) {
      this.logger.log('Device registered successfully', 'DevicesController - register', result.data);
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
      this.logger.error(
        'Device registration failed',
        result.message,
        'DevicesController - register',
        registerDeviceDto,
      );
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
    this.logger.log('Attempting to authenticate device', 'DevicesController - authenticate', authenticateDeviceDto);

    const result = await this.devicesService.authenticate(authenticateDeviceDto);
    if (result.success) {
      this.logger.log('Device authenticated successfully', 'DevicesController - authenticate', {
        deviceId: authenticateDeviceDto.deviceId,
      });
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
      this.logger.warn('Device authentication failed', 'DevicesController - authenticate', {
        deviceId: authenticateDeviceDto.deviceId,
        reason: result.message,
      });
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
    this.logger.log('Attempting to update device', 'DevicesController', { deviceId, ...updateDeviceDto });

    const result = await this.devicesService.updateDevice(deviceId, updateDeviceDto);
    if (result.success) {
      this.logger.log('Successfully updated device', 'DevicesController - updateDevice', { deviceId, ...result.data });
      return createApiResponse({
        success: true,
        message: result.message,
        data: result.data,
      });
    } else {
      this.logger.error('Failed to update device', result.message, 'DevicesController - updateDevice', {
        deviceId,
        ...updateDeviceDto,
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

  @Delete(':deviceId')
  @ApiOperation({ summary: 'Delete a device by device ID' })
  @ApiParam({ name: 'deviceId', type: 'string' })
  @ApiResponse({ status: 200, description: 'The device has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Device not found.' })
  async deleteDeviceByDeviceId(@Param('deviceId') deviceId: string) {
    this.logger.log('Attempting to delete device', 'DevicesController - deleteDeviceByDeviceId', { deviceId });

    const result = await this.devicesService.deleteDeviceByDeviceId(deviceId);
    if (result.success) {
      this.logger.log('Successfully deleted device', 'DevicesController', { deviceId });
      return createApiResponse({
        success: true,
        message: result.message,
      });
    } else {
      this.logger.error('Failed to delete device', result.message, 'DevicesController - deleteDeviceByDeviceId', {
        deviceId,
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
}
