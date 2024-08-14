import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from 'src/entities';
import { ErrorCode } from 'src/common/enums/error-codes.enum';
import { ServiceResult } from 'src/common/types';
import { CryptoService } from './crypto.service';
import { AuthenticateDeviceDto, RegisterDeviceDto } from './dto';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device)
    private deviceRepository: Repository<Device>,
    private cryptoService: CryptoService,
  ) {}

  async register(registerDeviceDto: RegisterDeviceDto): Promise<ServiceResult<Device>> {
    const { publicKey, deviceId } = registerDeviceDto;
    const existingDevice = await this.deviceRepository.findOne({ where: { deviceId } });

    if (existingDevice) {
      return {
        success: false,
        message: 'Device ID already exists',
        errorCode: ErrorCode.DEVICE_ALREADY_EXISTS,
      };
    }

    const device = this.deviceRepository.create({ publicKey, deviceId });
    const savedDevice = await this.deviceRepository.save(device);
    return {
      success: true,
      message: 'Device registered successfully',
      data: savedDevice,
    };
  }

  async authenticate(authenticateDeviceDto: AuthenticateDeviceDto): Promise<ServiceResult<void>> {
    const { signature, deviceType, deviceId } = authenticateDeviceDto;
    const device = await this.deviceRepository.findOne({ where: { deviceId } });

    if (!device) {
      return {
        success: false,
        message: 'Device not found',
        errorCode: ErrorCode.DEVICE_NOT_FOUND,
      };
    }

    const message = deviceId;
    const isValid = this.cryptoService.verify(device.publicKey, signature, message);

    if (isValid) {
      device.isAuthenticated = true;
      device.deviceType = deviceType;
      await this.deviceRepository.save(device);
      return { success: true, message: 'Device authenticated successfully' };
    } else {
      return {
        success: false,
        message: 'Authentication failed',
        errorCode: ErrorCode.AUTHENTICATION_FAILED,
      };
    }
  }

  async getDeviceById(id: number): Promise<ServiceResult<Device>> {
    const device = await this.deviceRepository.findOne({ where: { id } });
    if (!device) {
      return {
        success: false,
        message: 'Device not found',
        errorCode: ErrorCode.DEVICE_NOT_FOUND,
      };
    }
    return { success: true, message: 'Device found', data: device };
  }

  async getDeviceByDeviceId(deviceId: string): Promise<ServiceResult<Device>> {
    const device = await this.deviceRepository.findOne({ where: { deviceId } });
    if (!device) {
      return {
        success: false,
        message: 'Device not found',
        errorCode: ErrorCode.DEVICE_NOT_FOUND,
      };
    }
    return { success: true, message: 'Device found', data: device };
  }

  async getDeviceList(): Promise<ServiceResult<Device[]>> {
    const devices = await this.deviceRepository.find();
    return { success: true, message: 'Devices retrieved successfully', data: devices };
  }
}
