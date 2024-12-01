import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { PqcGatewayController } from './pqc-gateway.controller';
import { PqcGatewayService } from './pqc-gateway.service';
import { LoggerService } from 'src/logger/logger.service';
import { PqcGatewayStatusDto, PqcGatewayAlarmDto, GetPqcGatewayAlarmsDto } from './dto';
import { AlarmStatus, AlarmType, ErrorCode, SortOrder } from 'src/common/enums';

describe('PqcGatewayController', () => {
  let controller: PqcGatewayController;
  let pqcGatewayService: PqcGatewayService;
  let loggerService: LoggerService;

  const mockPqcGatewayService = {
    updateDevicesStatus: jest.fn(),
    updatePqcGatewayAlarm: jest.fn(),
    getAlarms: jest.fn(),
  };

  const mockLoggerService = {
    log: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PqcGatewayController],
      providers: [
        {
          provide: PqcGatewayService,
          useValue: mockPqcGatewayService,
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    controller = module.get<PqcGatewayController>(PqcGatewayController);
    pqcGatewayService = module.get<PqcGatewayService>(PqcGatewayService);
    loggerService = module.get<LoggerService>(LoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('updatePqcGatewayStatus', () => {
    const mockStatusDto: PqcGatewayStatusDto = {
      deviceId: 'test-device',
      deviceName: 'Test Device',
      signature: 'test-signature',
      deviceInfo: [],
      networkInfo: {
        networkRoute: 'ETHERNET',
        uploadTraffic: '0.68 kbit/s',
        downloadTraffic: '13.83 kbit/s',
        networkInfo: [
          {
            Interface: 'WAN1',
            host: 'ETHERNET',
            ipAddr: '192.168.1.99',
          },
        ],
      },
    };

    it('should successfully update status', async () => {
      const expectedResponse = {
        success: true,
        data: {
          deviceCtrl: [{ ipAddr: '192.168.1.1', bandwidth: 'medium' }],
        },
      };

      mockPqcGatewayService.updateDevicesStatus.mockResolvedValue(expectedResponse);

      const result = await controller.updatePqcGatewayStatus(mockStatusDto);

      expect(result).toEqual({
        result: 'success',
        deviceCtrl: expectedResponse.data.deviceCtrl,
      });
      expect(loggerService.log).toHaveBeenCalled();
    });

    it('should handle update status failure', async () => {
      const errorResponse = {
        success: false,
        message: 'Authentication failed',
        errorCode: ErrorCode.AUTHENTICATION_FAILED,
      };

      mockPqcGatewayService.updateDevicesStatus.mockResolvedValue(errorResponse);

      await expect(controller.updatePqcGatewayStatus(mockStatusDto)).rejects.toThrow(HttpException);
      expect(loggerService.error).toHaveBeenCalled();
    });

    it('should handle device not found error', async () => {
      const errorResponse = {
        success: false,
        message: 'Device not found',
        errorCode: ErrorCode.DEVICE_NOT_FOUND,
      };

      mockPqcGatewayService.updateDevicesStatus.mockResolvedValue(errorResponse);

      await expect(controller.updatePqcGatewayStatus(mockStatusDto)).rejects.toThrow(HttpException);
      expect(loggerService.error).toHaveBeenCalled();
    });
  });

  describe('updatePqcGatewayAlarm', () => {
    const mockAlarmDto: PqcGatewayAlarmDto = {
      deviceId: 'test-device',
      deviceName: 'Test Device',
      signature: 'test-signature',
      alarmInfo: [
        {
          alarmType: AlarmType.WARNING,
          alarmDescription: 'Network error',
        },
      ],
    };

    it('should successfully update alarm', async () => {
      const expectedResponse = {
        success: true,
        message: 'Alarm updated',
        data: {
          updatedAlarms: [
            {
              alarmType: AlarmType.WARNING,
              alarmDescription: 'Network error',
            },
          ],
        },
      };

      mockPqcGatewayService.updatePqcGatewayAlarm.mockResolvedValue(expectedResponse);

      const result = await controller.updatePqcGatewayAlarm(mockAlarmDto);

      expect(result).toEqual({
        result: 'success',
        message: expectedResponse.message,
        updatedAlarms: expectedResponse.data.updatedAlarms,
      });
      expect(loggerService.log).toHaveBeenCalled();
    });

    it('should handle update alarm failure', async () => {
      const errorResponse = {
        success: false,
        message: 'Authentication failed',
        errorCode: ErrorCode.AUTHENTICATION_FAILED,
      };

      mockPqcGatewayService.updatePqcGatewayAlarm.mockResolvedValue(errorResponse);

      await expect(controller.updatePqcGatewayAlarm(mockAlarmDto)).rejects.toThrow(HttpException);
      expect(loggerService.error).toHaveBeenCalled();
    });
  });

  describe('getPqcGatewayAlarms', () => {
    const mockGetAlarmsDto: GetPqcGatewayAlarmsDto = {
      page: 1,
      limit: 10,
      alarmType: AlarmType.WARNING,
      alarmStatus: AlarmStatus.ACTIVE,
      sortBy: 'createdAt',
      sortOrder: SortOrder.DESC,
    };

    it('should successfully get alarms', async () => {
      const mockAlarms = [
        {
          id: 1,
          alarmType: AlarmType.WARNING,
          alarmDescription: 'Network error',
          alarmStatus: AlarmStatus.ACTIVE,
          createdAt: new Date(),
        },
      ];

      const expectedResponse = {
        success: true,
        data: {
          alarms: mockAlarms,
          total: 1,
        },
      };

      mockPqcGatewayService.getAlarms.mockResolvedValue(expectedResponse);

      const result = await controller.getPqcGatewayAlarms(mockGetAlarmsDto);

      expect(result).toEqual(expectedResponse.data);
      expect(loggerService.log).toHaveBeenCalled();
    });

    it('should handle get alarms failure', async () => {
      const errorResponse = {
        success: false,
        message: 'Invalid date parameters',
        errorCode: ErrorCode.INVALID_DATE_PARAMETERS,
      };

      mockPqcGatewayService.getAlarms.mockResolvedValue(errorResponse);

      await expect(controller.getPqcGatewayAlarms(mockGetAlarmsDto)).rejects.toThrow(HttpException);
      expect(loggerService.error).toHaveBeenCalled();
    });
  });
});
