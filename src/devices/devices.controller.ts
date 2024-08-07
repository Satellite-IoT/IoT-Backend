import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpStatus,
  HttpException,
  BadRequestException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { createApiResponse } from '../common/utils/response.util';
import { DevicesService } from './devices.service';
import { AuthenticateDeviceDto, RegisterDeviceDto } from './dto';

@Controller('devices')
@UsePipes(new ValidationPipe({ transform: true }))
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post('register')
  async register(@Body() registerDeviceDto: RegisterDeviceDto) {
    console.log('registerDeviceDto', registerDeviceDto);
    try {
      const device = await this.devicesService.register(registerDeviceDto);
      return createApiResponse({
        success: true,
        message: 'Device registered successfully',
        data: device,
      });
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw new HttpException(
          createApiResponse({
            success: false,
            message: 'Failed to register device',
            error: error.message,
          }),
          HttpStatus.BAD_REQUEST,
        );
      }
      throw new HttpException(
        createApiResponse({
          success: false,
          message: 'Internal server error',
        }),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('authenticate')
  async authenticate(@Body() authenticateDeviceDto: AuthenticateDeviceDto) {
    try {
      const result = await this.devicesService.authenticate(authenticateDeviceDto);
      if (result.success) {
        return createApiResponse({
          success: true,
          message: result.message,
        });
      } else {
        throw new HttpException(
          createApiResponse({
            success: false,
            message: 'Authentication failed',
            error: result.message,
          }),
          HttpStatus.UNAUTHORIZED,
        );
      }
    } catch (error) {
      throw new HttpException(
        createApiResponse({
          success: false,
          message: 'Authentication failed',
        }),
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  @Get('list')
  async getDeviceList() {
    try {
      const devices = await this.devicesService.getDeviceList();
      return createApiResponse({
        success: true,
        message: 'Devices retrieved successfully',
        data: devices,
      });
    } catch (error) {
      throw new HttpException(
        createApiResponse({
          success: false,
          message: 'Internal server error',
        }),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async getDevice(@Param('id') id: string) {
    try {
      const device = await this.devicesService.getDevice(+id);
      if (!device) {
        throw new HttpException(
          createApiResponse({
            success: false,
            message: 'Device not found',
          }),
          HttpStatus.NOT_FOUND,
        );
      }
      return createApiResponse({
        success: true,
        message: 'Device found',
        data: device,
      });
    } catch (error) {
      if (error.status === HttpStatus.NOT_FOUND) {
        throw error;
      }
      throw new HttpException(
        createApiResponse({
          success: false,
          message: 'Internal server error',
        }),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
