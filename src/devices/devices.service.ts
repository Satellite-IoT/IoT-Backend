import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from 'src/entities';
import { ErrorCode, SortField } from 'src/common/enums';
import { ServiceResult } from 'src/common/types';
import { CryptoService } from './crypto.service';
import { AuthenticateDeviceDto, GetDeviceListDto, RegisterDeviceDto, UpdateDeviceDto } from './dto';
import { PqcGatewayStatusDto } from 'src/pqc-gateway/dto';
import { PqcGatewayNetwork } from 'src/entities/pqc-gateway-network.entity';
import { PqcGatewayConnection } from 'src/entities/pqc-gateway-connection.entity';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device)
    private deviceRepository: Repository<Device>,
    @InjectRepository(PqcGatewayNetwork)
    private pqcNetworkRepository: Repository<PqcGatewayNetwork>,
    @InjectRepository(PqcGatewayConnection)
    private connectionRepository: Repository<PqcGatewayConnection>,
    private cryptoService: CryptoService,
  ) {}

  private static readonly DEFAULT_TIMEOUT_MS = 3 * 60 * 1000; // 3 minute in milliseconds

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

  private isValidSortField(field: SortField): boolean {
    return Object.values(SortField).includes(field);
  }

  private async getDeviceWithUpdatedStatus(device: Device): Promise<Device> {
    const currentTime = new Date();
    const newStatus = this.getDeviceConnectionStatus(device, currentTime);
    if (device.status !== newStatus) {
      device.status = newStatus;
      await this.deviceRepository.save(device);
    }
    return device;
  }

  async register(registerDeviceDto: RegisterDeviceDto): Promise<ServiceResult<Device>> {
    const { publicKey, deviceId, ...optionalFields } = registerDeviceDto;
    let device = await this.deviceRepository.findOne({ where: { deviceId } });

    if (device?.isRegistered) {
      return {
        success: false,
        message: 'Device ID already registered',
        errorCode: ErrorCode.DEVICE_ALREADY_REGISTERED,
      };
    }

    const allowedFields = ['ipAddr', 'deviceName', 'flowControlLevel'];

    const updatedFields = {
      publicKey,
      deviceId,
      status: 'disconnected',
      isRegistered: true,
      ...Object.entries(optionalFields).reduce(
        (acc, [key, value]) => (allowedFields.includes(key) && value !== undefined ? { ...acc, [key]: value } : acc),
        {},
      ),
    };

    if (device) {
      // Update existing device
      Object.assign(device, updatedFields);
    } else {
      // Create new device
      device = this.deviceRepository.create(updatedFields);
    }

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
      Object.assign(device, {
        deviceType,
        isAuthenticated: true,
        lastAuthenticated: new Date(),
        ...(ipAddr && { ipAddr }),
      });

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

  async deleteDeviceByDeviceId(deviceId: string): Promise<ServiceResult<void>> {
    const device = await this.deviceRepository.findOne({ where: { deviceId } });

    if (!device) {
      return {
        success: false,
        message: 'Device not found',
        errorCode: ErrorCode.DEVICE_NOT_FOUND,
      };
    }

    try {
      await this.deviceRepository.remove(device);
      return {
        success: true,
        message: 'Device deleted successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to delete device',
        errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
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
    const updatedDevice = await this.getDeviceWithUpdatedStatus(device);
    return { success: true, message: 'Device found', data: updatedDevice };
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
    const updatedDevice = await this.getDeviceWithUpdatedStatus(device);
    return { success: true, message: 'Device found', data: updatedDevice };
  }

  async getDeviceList(
    getDeviceListDto: GetDeviceListDto,
  ): Promise<ServiceResult<{ devices: Device[]; total: number }>> {
    const { page, limit, includePqcGateway, sortBy, sortOrder } = getDeviceListDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.deviceRepository.createQueryBuilder('device');

    if (includePqcGateway === false) {
      queryBuilder.andWhere(`(device.deviceType != :pqcGatewayType OR device.deviceType IS NULL)`, {
        pqcGatewayType: 'pqc-gateway',
      });
    }

    // Add sorting
    if (this.isValidSortField(sortBy)) {
      if (['lastAuthenticated', 'createdAt', 'updatedAt'].includes(sortBy)) {
        // For date fields, use NULLS LAST to handle null values
        queryBuilder
          .orderBy(`CASE WHEN device.${sortBy} IS NULL THEN 1 ELSE 0 END`, 'ASC')
          .addOrderBy(`device.${sortBy}`, sortOrder);
      } else {
        queryBuilder.orderBy(`device.${sortBy}`, sortOrder);
      }
    } else {
      queryBuilder.orderBy('device.id', 'ASC'); // Default sorting
    }

    const [devices, total] = await queryBuilder.skip(skip).take(limit).getManyAndCount();

    // Retrieve network information for PQC Gateways
    const networkInfos = await this.pqcNetworkRepository.find();
    const networkInfoMap = new Map(
      networkInfos.map(info => [info.deviceId, info.networkInfo])
    );

    // Retrieve device connection relationships
    const connections = await this.connectionRepository.find();
    const deviceToGatewayMap = new Map(
      connections.map(conn => [conn.connectedDeviceId, conn.gatewayDeviceId])
    );

    const now = new Date();
    const devicesWithStatus = devices.map(device => {
      const devicesWithStatus: any = {
        ...device,
        status: this.getDeviceConnectionStatus(device, now),
      };

      // For PQC Gateway, add network information
      if (device.deviceType === 'pqc-gateway') {
        const networkInfo = networkInfoMap.get(device.deviceId);
        if (networkInfo) {
          devicesWithStatus.networkInfo = networkInfo;
          devicesWithStatus.connectedGatewayId = null;
        }
      } else {
        // For regular devices, check if connected to a Gateway
        const connectedGatewayId = deviceToGatewayMap.get(device.deviceId);
        if (connectedGatewayId) {
          devicesWithStatus.networkInfo = null;
          devicesWithStatus.connectedGatewayId = connectedGatewayId;
        }
      }

      return devicesWithStatus;
    });

    return {
      success: true,
      message: 'Devices retrieved successfully',
      data: {
        devices: devicesWithStatus,
        total,
      },
    };
  }

  async updateDevice(deviceId: string, updateDeviceDto: UpdateDeviceDto): Promise<ServiceResult<Device>> {
    const device = await this.deviceRepository.findOne({ where: { deviceId } });

    if (!device) {
      return {
        success: false,
        message: 'Device not found',
        errorCode: ErrorCode.DEVICE_NOT_FOUND,
      };
    }

    Object.assign(device, updateDeviceDto);
    device.updatedAt = new Date();

    try {
      const updatedDevice = await this.deviceRepository.save(device);
      return {
        success: true,
        message: 'Device updated successfully',
        data: updatedDevice,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update device',
        errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
      };
    }
  }

  async updateOrCreateDevice(deviceData: Partial<Device>): Promise<Device> {
    const { deviceId, ...updateData } = deviceData;
    let device = await this.deviceRepository.findOne({ where: { deviceId } });

    if (device) {
      // Update existing device
      Object.assign(device, updateData);
    } else {
      // Create new device
      device = this.deviceRepository.create({
        ...deviceData,
      });
    }
    const now = new Date();
    device.status = this.getDeviceConnectionStatus(device, now);

    return await this.deviceRepository.save(device);
  }
}
