import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from 'src/entities';
import * as crypto from 'crypto';
import { AuthenticateDeviceDto, RegisterDeviceDto } from './dto';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device)
    private deviceRepository: Repository<Device>,
  ) {}

  async register(registerDeviceDto: RegisterDeviceDto): Promise<Device> {
    const { publicKey, deviceId } = registerDeviceDto;
    const existingDevice = await this.deviceRepository.findOne({ where: { deviceId } });

    if (existingDevice) {
      throw new BadRequestException('Device ID already exists');
    }

    const device = this.deviceRepository.create({ publicKey, deviceId });
    return await this.deviceRepository.save(device);
  }

  async authenticate(authenticateDeviceDto: AuthenticateDeviceDto): Promise<{ success: boolean; message: string }> {
    const { signature, deviceType, deviceId } = authenticateDeviceDto;
    const device = await this.deviceRepository.findOne({ where: { deviceId } });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    const verifier = crypto.createVerify('SHA256');
    verifier.update(deviceId + deviceType);
    const isValid = verifier.verify(device.publicKey, signature, 'base64');

    if (isValid) {
      device.isAuthenticated = true;
      device.deviceType = deviceType;
      await this.deviceRepository.save(device);
      return { success: true, message: 'Device authenticated successfully' };
    } else {
      return { success: false, message: 'Authentication failed' };
    }
  }

  async getDevice(id: number): Promise<Device> {
    const device = await this.deviceRepository.findOne({ where: { id } });
    if (!device) {
      throw new NotFoundException('Device not found');
    }
    return device;
  }

  async getDeviceList(): Promise<Device[]> {
    return await this.deviceRepository.find();
  }
}
