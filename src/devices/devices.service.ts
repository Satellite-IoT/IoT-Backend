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

  private static readonly DEFAULT_TIMEOUT_MS = 60 * 1000; // 1 minute in milliseconds

  private getDeviceConnectionStatus(device: Device, currentTime: Date): 'connected' | 'disconnected' | 'unknown' {
    if (!device.isRegistered) {
      return 'unknown';
    }

    if (!device.lastAuthenticated) {
      return 'disconnected';
    }

    return currentTime.getTime() - device.lastAuthenticated.getTime() <= DevicesService.DEFAULT_TIMEOUT_MS
      ? 'connected'
      : 'disconnected';
  }

  async register(registerDeviceDto: RegisterDeviceDto): Promise<ServiceResult<Device>> {
    const { publicKey, deviceId, ...optionalFields } = registerDeviceDto;
    const existingDevice = await this.deviceRepository.findOne({ where: { deviceId } });

    if (existingDevice) {
      return {
        success: false,
        message: 'Device ID already exists',
        errorCode: ErrorCode.DEVICE_ALREADY_EXISTS,
      };
    }

    const allowedFields = ['ipAddr', 'deviceName', 'flowControlLevel'];

    const device = this.deviceRepository.create({
      publicKey,
      deviceId,
      status: 'disconnected',
      isRegistered: true,
      ...Object.entries(optionalFields).reduce(
        (acc, [key, value]) => (allowedFields.includes(key) && value !== undefined ? { ...acc, [key]: value } : acc),
        {},
      ),
    });

    const savedDevice = await this.deviceRepository.save(device);
    return {
      success: true,
      message: 'Device registered successfully',
      data: savedDevice,
    };
  }

  async authenticate(authenticateDeviceDto: AuthenticateDeviceDto): Promise<ServiceResult<void>> {
    const { signature, deviceType, deviceId, ipAddr } = authenticateDeviceDto;
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
      device.ipAddr = ipAddr;
      device.lastAuthenticated = new Date();
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
    const now = new Date();
    device.status = this.getDeviceConnectionStatus(device, now);
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
    const now = new Date();
    device.status = this.getDeviceConnectionStatus(device, now);
    return { success: true, message: 'Device found', data: device };
  }

  async getDeviceList(): Promise<ServiceResult<Device[]>> {
    const devices = await this.deviceRepository.find();
    const now = new Date();
    const devicesWithStatus = devices.map((device) => ({
      ...device,
      status: this.getDeviceConnectionStatus(device, now),
    }));

    return {
      success: true,
      message: 'Devices retrieved successfully',
      data: devicesWithStatus,
    };
  }
}
