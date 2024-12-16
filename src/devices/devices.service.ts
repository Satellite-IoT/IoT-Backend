import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alarm, Device } from 'src/entities';
import { AlarmType, ErrorCode, SortField } from 'src/common/enums';
import { ServiceResult } from 'src/common/types';
import { CryptoService } from './crypto.service';
import {
  AuthenticateDeviceDto,
  DeviceStatisticsResponseDto,
  GetDeviceListDto,
  RegisterDeviceDto,
  UpdateDeviceDto,
} from './dto';
import { PqcGatewayStatusDto } from 'src/pqc-gateway/dto';
import { PqcGatewayNetwork } from 'src/entities/pqc-gateway-network.entity';
import { PqcGatewayConnection } from 'src/entities/pqc-gateway-connection.entity';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device)
    private deviceRepository: Repository<Device>,
    @InjectRepository(Alarm)
    private alarmRepository: Repository<Alarm>,
    @InjectRepository(PqcGatewayNetwork)
    private pqcNetworkRepository: Repository<PqcGatewayNetwork>,
    @InjectRepository(PqcGatewayConnection)
    private connectionRepository: Repository<PqcGatewayConnection>,
    private cryptoService: CryptoService,
  ) {}

  private static readonly DEFAULT_TIMEOUT_MS = 3 * 60 * 1000; // 3 minute in milliseconds

  private async createSystemAlarm(deviceId: string, alarmType: AlarmType, description: string): Promise<void> {
    const alarm = this.alarmRepository.create({
      alarmType,
      alarmDescription: description,
      deviceId,
      deviceName: deviceId,
    });
    await this.alarmRepository.save(alarm);
  }

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

    const device = await this.deviceRepository.findOne({
      where: { deviceId },
      select: ['id', 'isRegistered'],
    });

    if (device?.isRegistered) {
      return {
        success: false,
        message: 'Device ID already registered',
        errorCode: ErrorCode.DEVICE_ALREADY_REGISTERED,
      };
    }

    const allowedFields = new Set(['ipAddr', 'deviceName', 'flowControlLevel']); // 使用 Set 提升查詢效能

    const updatedFields = {
      publicKey,
      deviceId,
      status: 'disconnected',
      isRegistered: true,
    };

    for (const key in optionalFields) {
      if (allowedFields.has(key) && optionalFields[key] !== undefined) {
        updatedFields[key] = optionalFields[key];
      }
    }

    const deviceToSave = device ? Object.assign(device, updatedFields) : this.deviceRepository.create(updatedFields);

    const savedDevice = await this.deviceRepository.save(deviceToSave);

    await this.createSystemAlarm(deviceId, AlarmType.INFO, `New device registered - [${deviceId}]`);

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
      const wasAuthenticated: boolean = device.isAuthenticated;
      const currentTime = new Date();
      const timeDiff = device.lastAuthenticated
        ? currentTime.getTime() - device.lastAuthenticated.getTime()
        : Number.POSITIVE_INFINITY;

      Object.assign(device, {
        deviceType,
        isAuthenticated: true,
        lastAuthenticated: new Date(),
        ...(ipAddr && { ipAddr }),
      });

      await this.deviceRepository.save(device);

      if (!wasAuthenticated || timeDiff > 5 * 60 * 1000) {
        await this.createSystemAlarm(deviceId, AlarmType.INFO, `Device authenticated: ${deviceId}`);
      }

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
    const networkInfoMap = new Map(networkInfos.map((info) => [info.deviceId, info.networkInfo]));

    // Retrieve device connection relationships
    const connections = await this.connectionRepository.find();
    const deviceToGatewayMap = new Map(connections.map((conn) => [conn.connectedDeviceId, conn.gatewayDeviceId]));

    const now = new Date();
    const devicesWithStatus = devices.map((device) => {
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

  async getDeviceStatistics(): Promise<ServiceResult<DeviceStatisticsResponseDto>> {
    try {
      const daysAgo = 7;
      const now = new Date();
      const periodAgo = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

      const devices = await this.deviceRepository.find();

      const devicesWithCurrentStatus = devices.map((device) => ({
        ...device,
        currentStatus: this.getDeviceConnectionStatus(device, now),
      }));

      const mainStats = {
        totalDevices: devices.length,
        registeredDevices: devicesWithCurrentStatus.filter((d) => d.isRegistered).length,
        authenticatedDevices: devicesWithCurrentStatus.filter((d) => d.isAuthenticated).length,
        recentlyAddedDevices: devicesWithCurrentStatus.filter((d) => d.createdAt >= periodAgo).length,
      };

      const connectionStatusDistribution = {
        connected: devicesWithCurrentStatus.filter((d) => d.currentStatus === 'connected').length,
        disconnected: devicesWithCurrentStatus.filter((d) => d.currentStatus === 'disconnected').length,
        unknown: devicesWithCurrentStatus.filter((d) => d.currentStatus === 'unknown').length,
      };

      const deviceTypeDistribution = devicesWithCurrentStatus.reduce((acc, device) => {
        const deviceType = device.deviceType || 'unspecified';
        acc[deviceType] = (acc[deviceType] || 0) + 1;
        return acc;
      }, {});

      const flowControlDistribution = devicesWithCurrentStatus.reduce(
        (acc, device) => {
          if (device.flowControlLevel) {
            const level = device.flowControlLevel.toLowerCase();
            acc[level] = (acc[level] || 0) + 1;
          }
          return acc;
        },
        { high: 0, medium: 0, low: 0 },
      );

      const getDaysDifference = (createdAt: Date): number => {
        return (now.getTime() - createdAt.getTime()) / (24 * 60 * 60 * 1000);
      };

      const ageDistribution = {
        lessThan1Days: devicesWithCurrentStatus.filter((d) => {
          const diffDays = getDaysDifference(d.createdAt);
          return diffDays >= 0 && diffDays < 1;
        }).length,
        lessThan7Days: devicesWithCurrentStatus.filter((d) => {
          const diffDays = getDaysDifference(d.createdAt);
          return diffDays >= 1 && diffDays < 7;
        }).length,
        lessThan30Days: devicesWithCurrentStatus.filter((d) => {
          const diffDays = getDaysDifference(d.createdAt);
          return diffDays >= 7 && diffDays < 30;
        }).length,
        moreThan30Days: devicesWithCurrentStatus.filter((d) => {
          const diffDays = getDaysDifference(d.createdAt);
          return diffDays >= 30;
        }).length,
      };

      return {
        success: true,
        message: 'Device statistics retrieved successfully',
        data: {
          ...mainStats,
          connectionStatusDistribution,
          deviceTypeDistribution,
          flowControlDistribution,
          timeStats: {
            devicesByAgeGroups: ageDistribution,
          },
        },
      };
    } catch (error) {
      console.error('Error getting device statistics:', error);
      return {
        success: false,
        message: 'Failed to retrieve device statistics',
        errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
      };
    }
  }
}
