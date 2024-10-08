import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ErrorCode, EventLevel, EventTag, EventType } from 'src/common/enums';
import { ServiceResult } from 'src/common/types';
import { DevicesService } from 'src/devices/devices.service';
import { EventsService } from 'src/events/events.service';
import { Device, Event } from 'src/entities';
import { PqcGatewayAlarmDto } from './dto';

@Injectable()
export class PqcGatewayService {
  constructor(
    @InjectRepository(Device)
    private deviceRepository: Repository<Device>,
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    private devicesService: DevicesService,
    private eventsService: EventsService,
  ) {}

  async updatePqcGatewayAlarm(
    alarmData: PqcGatewayAlarmDto,
  ): Promise<ServiceResult<{ updatedEvents: Array<{ level: EventLevel; message: string }> }>> {
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

      const updatedEvents = await Promise.all(
        alarmData.alarmInfo.map(async (alarm) => {
          const event = await this.eventsService.createEvent({
            type: EventType.PQC_GATEWAY_ALARM,
            tag: EventTag.PQC_GATEWAY,
            level: alarm.alarmType,
            message: alarm.alarmDestription,
          });

          return {
            level: event.level,
            message: event.message,
          };
        }),
      );

      return {
        success: true,
        message: 'Alarm received successfully',
        data: { updatedEvents },
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
}
