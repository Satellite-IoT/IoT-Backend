import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PqcGatewayService } from './pqc-gateway.service';
import { DevicesService } from 'src/devices/devices.service';
import { Device, Event, Alarm } from 'src/entities';
import { PqcGatewayNetwork } from 'src/entities/pqc-gateway-network.entity';
import { PqcGatewayConnection } from 'src/entities/pqc-gateway-connection.entity';
import { AlarmStatus, AlarmType, ErrorCode, SortOrder } from 'src/common/enums';

describe('PqcGatewayService', () => {
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  let service: PqcGatewayService;
  let deviceRepository: Repository<Device>;
  let eventRepository: Repository<Event>;
  let alarmRepository: Repository<Alarm>;
  let pqcNetworkRepository: Repository<PqcGatewayNetwork>;
  let connectionRepository: Repository<PqcGatewayConnection>;
  let devicesService: DevicesService;

  const mockDeviceRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockEventRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockAlarmRepository = {
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockPqcNetworkRepository = {
    upsert: jest.fn(),
  };

  const mockConnectionRepository = {
    insert: jest.fn(),
    delete: jest.fn(),
  };

  const mockDevicesService = {
    authenticate: jest.fn(),
    updateOrCreateDevice: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PqcGatewayService,
        {
          provide: getRepositoryToken(Device),
          useValue: mockDeviceRepository,
        },
        {
          provide: getRepositoryToken(Event),
          useValue: mockEventRepository,
        },
        {
          provide: getRepositoryToken(Alarm),
          useValue: mockAlarmRepository,
        },
        {
          provide: getRepositoryToken(PqcGatewayNetwork),
          useValue: mockPqcNetworkRepository,
        },
        {
          provide: getRepositoryToken(PqcGatewayConnection),
          useValue: mockConnectionRepository,
        },
        {
          provide: DevicesService,
          useValue: mockDevicesService,
        },
      ],
    }).compile();

    service = module.get<PqcGatewayService>(PqcGatewayService);
    deviceRepository = module.get<Repository<Device>>(getRepositoryToken(Device));
    eventRepository = module.get<Repository<Event>>(getRepositoryToken(Event));
    alarmRepository = module.get<Repository<Alarm>>(getRepositoryToken(Alarm));
    pqcNetworkRepository = module.get<Repository<PqcGatewayNetwork>>(getRepositoryToken(PqcGatewayNetwork));
    connectionRepository = module.get<Repository<PqcGatewayConnection>>(getRepositoryToken(PqcGatewayConnection));
    devicesService = module.get<DevicesService>(DevicesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('updateDevicesStatus', () => {
    const mockStatusData = {
      deviceId: 'test-device',
      deviceName: 'Test Device',
      signature: 'test-signature',
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
      deviceInfo: [
        {
          deviceId: 'connected-device',
          deviceName: 'Connected Device',
          deviceType: 'laptop',
          loginUser: 'user1',
          host: 'worker-P45V',
          ipAddr: '192.168.1.2',
          flowControlLevel: '100',
        },
      ],
    };

    it('should successfully update device status', async () => {
      mockDevicesService.authenticate.mockResolvedValue({ success: true });
      mockDevicesService.updateOrCreateDevice.mockResolvedValue({
        deviceId: 'connected-device',
        deviceType: 'laptop',
        loginUser: 'user1',
        host: 'worker-P45V',
        ipAddr: '192.168.1.2',
        flowControlLevel: '100',
        status: 'active',
        isAuthenticated: true,
      });

      const result = await service.updateDevicesStatus(mockStatusData);

      expect(result.success).toBe(true);
      expect(result.data.deviceCtrl).toHaveLength(1);
      expect(mockPqcNetworkRepository.upsert).toHaveBeenCalledWith(
        {
          deviceId: mockStatusData.deviceId,
          networkInfo: mockStatusData.networkInfo,
        },
        ['deviceId'],
      );
      expect(mockConnectionRepository.insert).toHaveBeenCalled();
    });

    it('should handle authentication failure', async () => {
      mockDevicesService.authenticate.mockResolvedValue({
        success: false,
        message: 'Authentication failed',
        errorCode: ErrorCode.AUTHENTICATION_FAILED,
      });

      const result = await service.updateDevicesStatus(mockStatusData);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe(ErrorCode.AUTHENTICATION_FAILED);
      expect(mockPqcNetworkRepository.upsert).not.toHaveBeenCalled();
      expect(mockConnectionRepository.insert).not.toHaveBeenCalled();
    });

    it('should handle empty deviceInfo', async () => {
      const mockDataWithoutDevices = { ...mockStatusData, deviceInfo: [] };
      mockDevicesService.authenticate.mockResolvedValue({ success: true });

      const result = await service.updateDevicesStatus(mockDataWithoutDevices);

      expect(result.success).toBe(true);
      expect(result.data.deviceCtrl).toHaveLength(0);
      expect(mockConnectionRepository.insert).not.toHaveBeenCalled();
    });
  });

  describe('updatePqcGatewayAlarm', () => {
    const mockAlarmData = {
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
      mockDevicesService.authenticate.mockResolvedValue({ success: true });
      mockAlarmRepository.create.mockReturnValue({
        alarmType: AlarmType.WARNING,
        alarmDescription: 'Network error',
        deviceId: 'test-device',
        deviceName: 'Test Device',
        createdAt: new Date(),
      });
      mockAlarmRepository.save.mockImplementation((alarm) => Promise.resolve(alarm));

      const result = await service.updatePqcGatewayAlarm(mockAlarmData);

      expect(result.success).toBe(true);
      expect(result.data.updatedAlarms).toHaveLength(1);
      expect(mockAlarmRepository.create).toHaveBeenCalled();
      expect(mockAlarmRepository.save).toHaveBeenCalled();
    });

    it('should handle authentication failure', async () => {
      mockDevicesService.authenticate.mockResolvedValue({
        success: false,
        message: 'Authentication failed',
        errorCode: ErrorCode.AUTHENTICATION_FAILED,
      });

      const result = await service.updatePqcGatewayAlarm(mockAlarmData);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe(ErrorCode.AUTHENTICATION_FAILED);
    });
  });

  describe('getAlarms', () => {
    const mockQueryBuilder = {
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
    };

    beforeEach(() => {
      mockAlarmRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    });

    it('should successfully get alarms with filters', async () => {
      const mockAlarms = [
        {
          id: 1,
          alarmType: AlarmType.WARNING,
          alarmDescription: 'Network error',
          alarmStatus: AlarmStatus.ACTIVE,
          createdAt: new Date(),
        },
      ];

      const mockQuery = {
        page: 1,
        limit: 10,
        alarmType: AlarmType.WARNING,
        alarmStatus: AlarmStatus.ACTIVE,
        sortBy: 'createdAt' as const,
        sortOrder: SortOrder.DESC,
      };

      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockAlarms, 1]);

      const result = await service.getAlarms(mockQuery);

      expect(result.success).toBe(true);
      expect(result.data.alarms).toEqual(mockAlarms);
      expect(result.data.total).toBe(1);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('alarm.alarmType = :alarmType', {
        alarmType: AlarmType.WARNING,
      });
    });

    it('should handle timestamp parameters', async () => {
      const mockQuery = {
        page: 1,
        limit: 10,
        startTimestamp: Date.now(),
        sortBy: 'createdAt' as const,
        sortOrder: SortOrder.DESC,
      };

      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      const result = await service.getAlarms(mockQuery);

      expect(result.success).toBe(true);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('alarm.createdAt >= :startDate', expect.any(Object));
    });

    it('should handle invalid date parameters', async () => {
      const mockQuery = {
        page: 1,
        limit: 10,
        startDate: new Date(),
        startTimestamp: Date.now(),
        sortBy: 'createdAt' as const,
        sortOrder: SortOrder.DESC,
      };

      const result = await service.getAlarms(mockQuery);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe(ErrorCode.INVALID_DATE_PARAMETERS);
    });

    it('should handle database error', async () => {
      const mockQuery = {
        page: 1,
        limit: 10,
        sortBy: 'createdAt' as const,
        sortOrder: SortOrder.DESC,
      };

      mockQueryBuilder.getManyAndCount.mockRejectedValue(new Error('Database error'));

      const result = await service.getAlarms(mockQuery);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
    });

    it('should handle both end date and end timestamp', async () => {
      const mockQuery = {
        page: 1,
        limit: 10,
        endDate: new Date(),
        endTimestamp: Date.now(),
        sortBy: 'createdAt' as const,
        sortOrder: SortOrder.DESC,
      };

      const result = await service.getAlarms(mockQuery);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe(ErrorCode.INVALID_DATE_PARAMETERS);
    });
  });
});
