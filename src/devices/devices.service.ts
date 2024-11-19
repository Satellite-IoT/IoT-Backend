import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from 'src/entities';
import { ErrorCode, SortField } from 'src/common/enums';
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

      const mainStats = await this.deviceRepository
        .createQueryBuilder('device')
        .select([
          'COUNT(device.id) as "totalDevices"',
          'COUNT(CASE WHEN device.isRegistered = true THEN 1 END) as "registeredDevices"',
          'COUNT(CASE WHEN device.isAuthenticated = true THEN 1 END) as "authenticatedDevices"',
          'COUNT(CASE WHEN device.createdAt >= :periodAgo THEN 1 END) as "recentlyAddedDevices"',
          'COUNT(CASE WHEN device.status = \'connected\' THEN 1 END) as "connectedDevices"',
          'COUNT(CASE WHEN device.status = \'disconnected\' THEN 1 END) as "disconnectedDevices"',
          'COUNT(CASE WHEN device.status = \'unknown\' THEN 1 END) as "unknownDevices"',
        ])
        .setParameter('periodAgo', periodAgo)
        .getRawOne();

      const deviceTypes = await this.deviceRepository
        .createQueryBuilder('device')
        .select(['COALESCE(device.deviceType, \'unspecified\') as "deviceType"', 'COUNT(device.id) as count'])
        .groupBy('device.deviceType')
        .getRawMany();
      console.log('deviceTypes:', deviceTypes); // 加入這行來看實際的查詢結果

      const flowControlLevels = await this.deviceRepository
        .createQueryBuilder('device')
        .select(['device.flowControlLevel as "flowControlLevel"', 'COUNT(device.id) as count'])
        .groupBy('device.flowControlLevel')
        .getRawMany();

      console.log('flowControlLevels:', flowControlLevels); // 加入這行來看實際的查詢結果

      // 4. 設備年齡分布
      const oneDaysAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const ageDistribution = await this.deviceRepository
        .createQueryBuilder('device')
        .select([
          'COUNT(CASE WHEN device.createdAt >= :oneDaysAgo THEN 1 END) as "lessThan1Days"',
          'COUNT(CASE WHEN device.createdAt >= :sevenDaysAgo AND device.createdAt < :oneDaysAgo THEN 1 END) as "lessThan7Days"',
          'COUNT(CASE WHEN device.createdAt >= :thirtyDaysAgo AND device.createdAt < :sevenDaysAgo THEN 1 END) as "lessThan30Days"',
          'COUNT(CASE WHEN device.createdAt < :thirtyDaysAgo THEN 1 END) as "moreThan30Days"',
        ])
        .setParameter('oneDaysAgo', oneDaysAgo)
        .setParameter('sevenDaysAgo', sevenDaysAgo)
        .setParameter('thirtyDaysAgo', thirtyDaysAgo)
        .getRawOne();

      const deviceTypeDistribution = deviceTypes.reduce((acc, { deviceType, count }) => {
        acc[deviceType] = parseInt(count);
        return acc;
      }, {});

      const flowControlDistribution = flowControlLevels.reduce(
        (acc, { flowControlLevel, count }) => {
          acc[flowControlLevel.toLowerCase()] = parseInt(count);
          return acc;
        },
        { high: 0, medium: 0, low: 0 },
      );

      return {
        success: true,
        message: 'Device statistics retrieved successfully',
        data: {
          totalDevices: parseInt(mainStats.totalDevices),
          registeredDevices: parseInt(mainStats.registeredDevices),
          authenticatedDevices: parseInt(mainStats.authenticatedDevices),
          recentlyAddedDevices: parseInt(mainStats.recentlyAddedDevices),

          connectionStatusDistribution: {
            connected: parseInt(mainStats.connectedDevices),
            disconnected: parseInt(mainStats.disconnectedDevices),
            unknown: parseInt(mainStats.unknownDevices),
          },

          deviceTypeDistribution,
          flowControlDistribution,

          timeStats: {
            devicesByAgeGroups: {
              lessThan1Days: parseInt(ageDistribution.lessThan1Days),
              lessThan7Days: parseInt(ageDistribution.lessThan7Days),
              lessThan30Days: parseInt(ageDistribution.lessThan30Days),
              moreThan30Days: parseInt(ageDistribution.moreThan30Days),
            },
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
