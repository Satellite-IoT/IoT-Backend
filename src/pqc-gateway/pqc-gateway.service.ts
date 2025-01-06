import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AlarmType, ErrorCode, EventLevel, EventTag, EventType, FlowControlLevel } from 'src/common/enums';
import { ServiceResult } from 'src/common/types';
import { DevicesService } from 'src/devices/devices.service';
import { Alarm, Device, DeviceUser, Event, PqcGatewayInfo, User } from 'src/entities';
import {
  AlarmDto,
  AlarmInfoDto,
  CreateAlarmDto,
  GetPqcGatewayAlarmsDto,
  PqcGatewayAlarmDto,
  PqcGatewayStatusDto,
} from './dto';
import { formatInTimeZone } from 'date-fns-tz';
import { PqcGatewayNetwork } from 'src/entities/pqc-gateway-network.entity';
import { PqcGatewayConnection } from 'src/entities/pqc-gateway-connection.entity';

@Injectable()
export class PqcGatewayService {
  constructor(
    @InjectRepository(Device)
    private deviceRepository: Repository<Device>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(DeviceUser)
    private deviceUserRepository: Repository<DeviceUser>,
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    @InjectRepository(Alarm)
    private alarmRepository: Repository<Alarm>,
    @InjectRepository(PqcGatewayNetwork)
    private pqcNetworkRepository: Repository<PqcGatewayNetwork>,
    @InjectRepository(PqcGatewayConnection)
    private connectionRepository: Repository<PqcGatewayConnection>,
    @InjectRepository(PqcGatewayInfo)
    private pqcInfoRepository: Repository<PqcGatewayInfo>,
    private devicesService: DevicesService,
  ) {}

  async updateDevicesStatus(
    statusData: PqcGatewayStatusDto,
  ): Promise<ServiceResult<{ deviceCtrl: Array<{ ipAddr: string; bandwidth: string }> }>> {
    try {
      // PQC Gateway authentication
      const authResult = await this.devicesService.authenticate({
        signature: statusData.signature,
        deviceType: 'pqc-gateway',
        deviceId: statusData.deviceId,
      });

      if (!authResult.success) {
        return {
          success: false,
          message: authResult.message,
          errorCode: authResult.errorCode,
        };
      }

      // Update PQC Gateway device
      await this.devicesService.updateOrCreateDevice({
        deviceId: statusData.deviceId,
        deviceName: statusData.deviceName,
        deviceType: 'pqc-gateway',
      });

      // Get current connections
      const currentConnections = await this.connectionRepository.find({
        where: { gatewayDeviceId: statusData.deviceId },
      });
      const currentDeviceIds = new Set(currentConnections.map((conn) => conn.connectedDeviceId));
      const newDeviceIds = new Set(statusData.deviceInfo?.map((info) => info.deviceId) || []);

       // Update network info
      await Promise.all([
        this.pqcNetworkRepository.upsert(
          {
            deviceId: statusData.deviceId,
            networkInfo: statusData.networkInfo,
          },
          ['deviceId'],
        ),
        // Update dispatch info
        this.pqcInfoRepository.upsert(
          {
            deviceId: statusData.deviceId,
            dispatchResult: statusData.dispatchResult,
            dispatchDate: statusData.dispatchDate,
          },
          ['deviceId'],
        ),
      ]);

      const deviceCtrl = [];

      if (statusData.deviceInfo && statusData.deviceInfo.length > 0) {
        const deviceIds = statusData.deviceInfo.map((info) => info.deviceId);
        const userNames = statusData.deviceInfo.filter((info) => info.loginUser).map((info) => info.loginUser);

        const users =
          userNames.length > 0
            ? await this.userRepository.find({
                where: { name: In(userNames) },
                select: ['name', 'flowControlLevel'],
              })
            : [];
        const userMap = new Map(users.map((user) => [user.name, user.flowControlLevel]));

        for (const deviceInfo of statusData.deviceInfo) {
          const existingDevice = await this.deviceRepository.findOne({
            where: { deviceId: deviceInfo.deviceId },
          });

          if (!existingDevice || !existingDevice.isRegistered) {
            await this.createAlarm({
              alarmType: AlarmType.WARNING,
              alarmDescription: `Unauthorized device connected to PQC Gateway - [${deviceInfo.deviceId}] IP: ${deviceInfo.ipAddr}`,
              deviceId: deviceInfo.deviceId,
            });
          }

          const updatedDevice = await this.devicesService.updateOrCreateDevice({
            deviceId: deviceInfo.deviceId,
            deviceType: deviceInfo.deviceType,
            ipAddr: deviceInfo.ipAddr,
            host: deviceInfo.host,
          });

          const bandwidth = deviceInfo.loginUser
            ? userMap.get(deviceInfo.loginUser) || FlowControlLevel.LOW
            : FlowControlLevel.LOW;

          deviceCtrl.push({
            deviceId: updatedDevice.deviceId,
            ipAddr: updatedDevice.ipAddr,
            bandwidth,
            status: updatedDevice.status,
            isAuthenticated: updatedDevice.isAuthenticated,
          });
        }

        await this.deviceUserRepository.delete({ deviceId: In(deviceIds) });
        const deviceUsers = statusData.deviceInfo
          .filter((info) => info.loginUser)
          .map((info) => ({
            deviceId: info.deviceId,
            loginUser: info.loginUser,
            lastSeenAt: new Date(),
          }));
        if (deviceUsers.length > 0) {
          await this.deviceUserRepository.insert(deviceUsers);
        }
      }

      for (const connectedDeviceId of currentDeviceIds) {
        if (!newDeviceIds.has(connectedDeviceId)) {
          const device = await this.deviceRepository.findOne({
            where: { deviceId: connectedDeviceId },
          });

          if (device && device.isRegistered) {
            await this.createAlarm({
              alarmType: AlarmType.WARNING,
              alarmDescription: `Authorized device disconnected from PQC Gateway - [${device.deviceId}]`,
              deviceId: device.deviceId,
            });
          }
        }
      }

      await this.connectionRepository.delete({ gatewayDeviceId: statusData.deviceId });
      if (statusData.deviceInfo && statusData.deviceInfo.length > 0) {
        await this.connectionRepository.insert(
          statusData.deviceInfo.map((info) => ({
            gatewayDeviceId: statusData.deviceId,
            connectedDeviceId: info.deviceId,
          })),
        );
      }

      return {
        success: true,
        message: 'Device status updated successfully',
        data: { deviceCtrl },
      };
    } catch (error) {
      console.error('Error updating device status:', error);
      return {
        success: false,
        message: 'Failed to update device status',
        errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
      };
    }
  }

  async updatePqcGatewayAlarm(
    alarmData: PqcGatewayAlarmDto,
  ): Promise<ServiceResult<{ updatedAlarms: Array<AlarmDto> }>> {
    try {
      // PQC Gateway authentication
      const authResult = await this.devicesService.authenticate({
        signature: alarmData.signature,
        deviceType: 'pqc-gateway',
        deviceId: alarmData.deviceId,
      });

      if (!authResult.success) {
        return {
          success: false,
          message: authResult.message,
          errorCode: authResult.errorCode,
        };
      }

      const updatedAlarms = await Promise.all(
        alarmData.alarmInfo.map(async (alarmItem) => {
          const createAlarmDto: CreateAlarmDto = {
            alarmType: alarmItem.alarmType,
            alarmDescription: alarmItem.alarmDescription,
            deviceId: alarmData.deviceId,
          };

          const alarm = await this.createAlarm(createAlarmDto);

          return {
            alarmType: alarm.alarmType,
            alarmDescription: alarm.alarmDescription,
            deviceId: alarm.deviceId,
            deviceName: alarm.deviceName,
            createdAt: formatInTimeZone(alarm.createdAt, 'Asia/Taipei', "yyyy-MM-dd'T'HH:mm:ssXXX"),
          };
        }),
      );

      return {
        success: true,
        message: 'Alarm received successfully',
        data: { updatedAlarms },
      };
    } catch (error) {
      console.error('Error updating pqc-gateway alarm:', error);
      return {
        success: false,
        message: 'Failed to receive pqc-gateway alarm',
        errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
      };
    }
  }

  async getAlarms(
    getPqcGatewayAlarmsDto: GetPqcGatewayAlarmsDto,
  ): Promise<ServiceResult<{ alarms: Alarm[]; total: number }>> {
    try {
      const {
        page,
        limit,
        alarmType,
        alarmStatus,
        sortBy,
        sortOrder,
        startDate,
        endDate,
        startTimestamp,
        endTimestamp,
      } = getPqcGatewayAlarmsDto;

      if ((startDate && startTimestamp) || (endDate && endTimestamp)) {
        return {
          success: false,
          message: 'Please provide either date or timestamp, not both',
          errorCode: ErrorCode.INVALID_DATE_PARAMETERS,
        };
      }

      const skip = (page - 1) * limit;

      const queryBuilder = this.alarmRepository.createQueryBuilder('alarm');

      if (alarmType) {
        queryBuilder.andWhere('alarm.alarmType = :alarmType', { alarmType });
      }

      if (alarmStatus) {
        queryBuilder.andWhere('alarm.alarmStatus = :alarmStatus', { alarmStatus });
      }

      let finalStartDate: Date | undefined;
      let finalEndDate: Date | undefined;

      if (startTimestamp) {
        finalStartDate = new Date(startTimestamp);
      } else if (startDate) {
        finalStartDate = startDate;
      }

      if (endTimestamp) {
        finalEndDate = new Date(endTimestamp);
      } else if (endDate) {
        finalEndDate = endDate;
      }

      if (finalStartDate) {
        queryBuilder.andWhere('alarm.createdAt >= :startDate', { startDate: finalStartDate });
      }

      if (finalEndDate) {
        queryBuilder.andWhere('alarm.createdAt <= :endDate', { endDate: finalEndDate });
      }

      queryBuilder.orderBy(`alarm.${sortBy}`, sortOrder);

      const [alarms, total] = await queryBuilder.skip(skip).take(limit).getManyAndCount();

      return {
        success: true,
        message: 'Alarms retrieved successfully',
        data: { alarms, total },
      };
    } catch (error) {
      console.error('Error retrieving alarms:', error);
      return {
        success: false,
        message: 'Failed to retrieve alarms',
        errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
      };
    }
  }

  private async createAlarm(createAlarmDto: CreateAlarmDto): Promise<Alarm> {
    const alarm = this.alarmRepository.create(createAlarmDto);
    return this.alarmRepository.save(alarm);
  }
}
