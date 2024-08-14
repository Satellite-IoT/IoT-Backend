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
} from '@nestjs/common';
import { ErrorCode } from '../common/enums/error-codes.enum';
import { createApiResponse } from '../common/utils/response.util';
import { AuthenticateDeviceDto, RegisterDeviceDto } from './dto';
import { DevicesService } from './devices.service';
import { CryptoService } from './crypto.service';
import { mapErrorCodeToHttpStatus } from 'src/common/utils/error-handler.util';

@Controller('devices')
@UsePipes(new ValidationPipe({ transform: true }))
export class DevicesController {
  constructor(
    private readonly devicesService: DevicesService,
    private readonly cryptoService: CryptoService,
  ) {}

  @Post('register')
  async register(@Body() registerDeviceDto: RegisterDeviceDto) {
    const result = await this.devicesService.register(registerDeviceDto);
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

  @Post('authenticate')
  async authenticate(@Body() authenticateDeviceDto: AuthenticateDeviceDto) {
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
          message: result.message,
          error: result.errorCode,
        }),
        mapErrorCodeToHttpStatus(result.errorCode),
      );
    }
  }

  @Get('list')
  async getDeviceList() {
    const result = await this.devicesService.getDeviceList();
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
}
