import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DevicesService } from './devices.service';
import { CryptoService } from './crypto.service';
import { Device } from 'src/entities';
import { PqcGatewayNetwork } from 'src/entities/pqc-gateway-network.entity';
import { PqcGatewayConnection } from 'src/entities/pqc-gateway-connection.entity';
import { ErrorCode, FlowControlLevel, SortField, SortOrder } from 'src/common/enums';

describe('DevicesService', () => {
  let service: DevicesService;
  let deviceRepository: Repository<Device>;
  let pqcNetworkRepository: Repository<PqcGatewayNetwork>;
  let connectionRepository: Repository<PqcGatewayConnection>;
  let cryptoService: CryptoService;

  // Mock data that will be used across all tests
  const mockConnection: PqcGatewayConnection = {
    id: 1,
    gatewayDeviceId: 'gateway-1',
    connectedDeviceId: 'test-device-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockNetworkInfo: PqcGatewayNetwork = {
    id: 1,
    deviceId: 'gateway-1',
    networkInfo: {
      networkRoute: 'default',
      uploadTraffic: '1.5 GB',
      downloadTraffic: '2.3 GB',
      networkInfo: [
        {
          Interface: 'eth0',
          host: 'gateway-host',
          ipAddr: '192.168.1.100',
        },
      ],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDevice: Device = {
    id: 1,
    deviceId: 'test-device-1',
    publicKey: 'test-public-key',
    deviceType: 'test-type',
    deviceName: 'Test Device',
    flowControlLevel: FlowControlLevel.MEDIUM,
    ipAddr: '192.168.1.1',
    host: 'test-host',
    loginUser: 'test-user',
    status: 'unknown',
    isRegistered: false,
    isAuthenticated: false,
    lastAuthenticated: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRegisteredDevice: Device = {
    ...mockDevice,
    isRegistered: true,
    status: 'disconnected',
  };

  const mockAuthenticatedDevice: Device = {
    ...mockRegisteredDevice,
    isAuthenticated: true,
    lastAuthenticated: new Date(),
    status: 'connected',
  };

  const mockDeviceWithNulls: Device = {
    ...mockDevice,
    deviceType: null,
    flowControlLevel: null,
    lastAuthenticated: null,
  };

  const defaultGetDeviceListDto = {
    page: 1,
    limit: 10,
    sortBy: SortField.ID,
    sortOrder: SortOrder.ASC,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DevicesService,
        {
          provide: getRepositoryToken(Device),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
            remove: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              addOrderBy: jest.fn().mockReturnThis(),
              skip: jest.fn().mockReturnThis(),
              take: jest.fn().mockReturnThis(),
              getManyAndCount: jest.fn(),
            })),
          },
        },
        {
          provide: getRepositoryToken(PqcGatewayNetwork),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(PqcGatewayConnection),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: CryptoService,
          useValue: {
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DevicesService>(DevicesService);
    deviceRepository = module.get<Repository<Device>>(getRepositoryToken(Device));
    pqcNetworkRepository = module.get<Repository<PqcGatewayNetwork>>(getRepositoryToken(PqcGatewayNetwork));
    connectionRepository = module.get<Repository<PqcGatewayConnection>>(getRepositoryToken(PqcGatewayConnection));
    cryptoService = module.get<CryptoService>(CryptoService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      deviceId: 'test-device-1',
      publicKey: 'test-public-key',
      deviceName: 'Test Device',
      flowControlLevel: FlowControlLevel.MEDIUM,
    };

    it('should register a new device successfully', async () => {
      jest.spyOn(deviceRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(deviceRepository, 'create').mockReturnValue(mockDevice);
      jest.spyOn(deviceRepository, 'save').mockResolvedValue(mockDevice);

      const result = await service.register(registerDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Device registered successfully');
      expect(result.data).toEqual(mockDevice);
      expect(deviceRepository.create).toHaveBeenCalled();
      expect(deviceRepository.save).toHaveBeenCalled();
    });

    it('should update existing unregistered device', async () => {
      const unregisteredDevice = { ...mockDevice, isRegistered: false };
      jest.spyOn(deviceRepository, 'findOne').mockResolvedValue(unregisteredDevice);
      jest.spyOn(deviceRepository, 'save').mockResolvedValue({
        ...unregisteredDevice,
        ...registerDto,
        isRegistered: true,
        status: 'disconnected',
      });

      const result = await service.register(registerDto);

      expect(result.success).toBe(true);
      expect(result.data.isRegistered).toBe(true);
    });

    it('should fail if device is already registered', async () => {
      jest.spyOn(deviceRepository, 'findOne').mockResolvedValue(mockRegisteredDevice);

      const result = await service.register(registerDto);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe(ErrorCode.DEVICE_ALREADY_REGISTERED);
    });
  });

  describe('authenticate', () => {
    const authenticateDto = {
      deviceId: 'test-device-1',
      signature: 'test-signature',
      deviceType: 'test-type',
      ipAddr: '192.168.1.1',
    };

    it('should authenticate device successfully', async () => {
      jest.spyOn(deviceRepository, 'findOne').mockResolvedValue(mockRegisteredDevice);
      jest.spyOn(cryptoService, 'verify').mockReturnValue(true);
      jest.spyOn(deviceRepository, 'save').mockResolvedValue({
        ...mockRegisteredDevice,
        isAuthenticated: true,
        lastAuthenticated: expect.any(Date),
      });

      const result = await service.authenticate(authenticateDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Device authenticated successfully');
      expect(deviceRepository.save).toHaveBeenCalled();
    });

    it('should fail if device not found', async () => {
      jest.spyOn(deviceRepository, 'findOne').mockResolvedValue(null);

      const result = await service.authenticate(authenticateDto);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe(ErrorCode.DEVICE_NOT_FOUND);
    });

    it('should fail when signature verification fails', async () => {
      jest.spyOn(deviceRepository, 'findOne').mockResolvedValue(mockRegisteredDevice);
      jest.spyOn(cryptoService, 'verify').mockReturnValue(false);

      const result = await service.authenticate(authenticateDto);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe(ErrorCode.AUTHENTICATION_FAILED);
      expect(deviceRepository.save).not.toHaveBeenCalled();
    });

    it('should update device IP address when provided', async () => {
      jest.spyOn(deviceRepository, 'findOne').mockResolvedValue(mockRegisteredDevice);
      jest.spyOn(cryptoService, 'verify').mockReturnValue(true);
      jest.spyOn(deviceRepository, 'save').mockImplementation(async (device) => device as Device);

      const result = await service.authenticate(authenticateDto);

      expect(result.success).toBe(true);
      expect(deviceRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          ipAddr: authenticateDto.ipAddr,
        }),
      );
    });
  });

  describe('getDeviceById and getDeviceByDeviceId', () => {
    it('should return device with updated status by ID', async () => {
      jest.spyOn(deviceRepository, 'findOne').mockResolvedValue(mockRegisteredDevice);
      jest.spyOn(deviceRepository, 'save').mockResolvedValue(mockRegisteredDevice);

      const result = await service.getDeviceById(1);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.status).toBe('connected');
    });

    it('should return device with updated status by DeviceId', async () => {
      jest.spyOn(deviceRepository, 'findOne').mockResolvedValue(mockAuthenticatedDevice);
      jest.spyOn(deviceRepository, 'save').mockResolvedValue(mockAuthenticatedDevice);

      const result = await service.getDeviceByDeviceId('test-device-1');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.status).toBe('connected');
    });

    it('should handle non-existent device for getDeviceById', async () => {
      jest.spyOn(deviceRepository, 'findOne').mockResolvedValue(null);

      const result = await service.getDeviceById(999);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe(ErrorCode.DEVICE_NOT_FOUND);
    });

    it('should handle non-existent device for getDeviceByDeviceId', async () => {
      jest.spyOn(deviceRepository, 'findOne').mockResolvedValue(null);

      const result = await service.getDeviceByDeviceId('non-existent');

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe(ErrorCode.DEVICE_NOT_FOUND);
    });
  });

  describe('getDeviceList', () => {
    it('should return list of devices with pagination', async () => {
      const devices = [mockDevice];
      const queryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([devices, 1]),
      };

      jest.spyOn(deviceRepository, 'createQueryBuilder').mockReturnValue(queryBuilder as any);
      jest.spyOn(pqcNetworkRepository, 'find').mockResolvedValue([]);
      jest.spyOn(connectionRepository, 'find').mockResolvedValue([]);

      const result = await service.getDeviceList(defaultGetDeviceListDto);

      expect(result.success).toBe(true);
      expect(result.data.devices).toHaveLength(1);
      expect(result.data.total).toBe(1);
    });

    it('should handle PQC Gateway devices correctly', async () => {
      const pqcGatewayDevice = {
        ...mockDevice,
        deviceId: 'gateway-1',
        deviceType: 'pqc-gateway',
      };

      const queryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[pqcGatewayDevice], 1]),
      };

      jest.spyOn(deviceRepository, 'createQueryBuilder').mockReturnValue(queryBuilder as any);
      jest.spyOn(pqcNetworkRepository, 'find').mockResolvedValue([mockNetworkInfo]);
      jest.spyOn(connectionRepository, 'find').mockResolvedValue([mockConnection]);

      const result = await service.getDeviceList({
        ...defaultGetDeviceListDto,
        includePqcGateway: true,
      });

      expect(result.success).toBe(true);
      expect(result.data.devices).toHaveLength(1);
      const deviceWithStatus = result.data.devices[0] as Device & { networkInfo: typeof mockNetworkInfo.networkInfo };
      expect(deviceWithStatus.networkInfo).toBeDefined();
      expect(deviceWithStatus.networkInfo.networkRoute).toBe('default');
    });

    it('should handle sorting by date fields with nulls', async () => {
      const queryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      jest.spyOn(deviceRepository, 'createQueryBuilder').mockReturnValue(queryBuilder as any);
      jest.spyOn(pqcNetworkRepository, 'find').mockResolvedValue([]);
      jest.spyOn(connectionRepository, 'find').mockResolvedValue([]);

      await service.getDeviceList({
        ...defaultGetDeviceListDto,
        sortBy: SortField.LAST_AUTHENTICATED,
        sortOrder: SortOrder.DESC,
      });

      expect(queryBuilder.orderBy).toHaveBeenCalledWith(
        'CASE WHEN device.lastAuthenticated IS NULL THEN 1 ELSE 0 END',
        'ASC',
      );
      expect(queryBuilder.addOrderBy).toHaveBeenCalledWith('device.lastAuthenticated', 'DESC');
    });

    it('should filter out PQC Gateway devices when includePqcGateway is false', async () => {
      const queryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      jest.spyOn(deviceRepository, 'createQueryBuilder').mockReturnValue(queryBuilder as any);
      jest.spyOn(pqcNetworkRepository, 'find').mockResolvedValue([]);
      jest.spyOn(connectionRepository, 'find').mockResolvedValue([]);

      await service.getDeviceList({
        ...defaultGetDeviceListDto,
        includePqcGateway: false,
      });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        '(device.deviceType != :pqcGatewayType OR device.deviceType IS NULL)',
        expect.any(Object),
      );
    });

    it('should use default sorting when invalid sort field is provided', async () => {
      const queryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      jest.spyOn(deviceRepository, 'createQueryBuilder').mockReturnValue(queryBuilder as any);
      jest.spyOn(pqcNetworkRepository, 'find').mockResolvedValue([]);
      jest.spyOn(connectionRepository, 'find').mockResolvedValue([]);

      await service.getDeviceList({
        ...defaultGetDeviceListDto,
        sortBy: 'invalidField' as SortField,
      });

      expect(queryBuilder.orderBy).toHaveBeenCalledWith('device.id', 'ASC');
    });
  });

  describe('getDeviceStatistics', () => {
    it('should calculate correct statistics for various device states', async () => {
      // 保存原始的 Date
      const RealDate = global.Date;

      // 先用真實的 Date 創建測試數據
      const mockDevices: Device[] = [
        {
          // 今天
          ...mockDevice,
          id: 1,
          createdAt: new Date('2024-01-01T00:00:00.000Z'),
          deviceType: 'type1',
          flowControlLevel: FlowControlLevel.HIGH,
        },
        {
          // 3天前
          ...mockDevice,
          id: 2,
          createdAt: new Date('2023-12-29T00:00:00.000Z'),
          deviceType: 'type1',
          flowControlLevel: FlowControlLevel.MEDIUM,
        },
        {
          // 6天前
          ...mockDevice,
          id: 3,
          createdAt: new Date('2023-12-26T00:00:00.000Z'),
          deviceType: 'type2',
          flowControlLevel: FlowControlLevel.LOW,
        },
        {
          // 15天前
          ...mockDevice,
          id: 4,
          createdAt: new Date('2023-12-17T00:00:00.000Z'),
          deviceType: 'type2',
          flowControlLevel: FlowControlLevel.HIGH,
        },
        {
          // 40天前
          ...mockDevice,
          id: 5,
          createdAt: new Date('2023-11-22T00:00:00.000Z'),
          deviceType: 'type3',
          flowControlLevel: FlowControlLevel.MEDIUM,
        },
      ];

      // Mock repository
      jest.spyOn(deviceRepository, 'find').mockResolvedValue(mockDevices);

      // 設置固定的測試時間點，在所有數據創建完之後
      const testDate = new Date('2024-01-01T00:00:00.000Z');

      // Mock Date
      global.Date = class extends Date {
        constructor() {
          super();
          return testDate;
        }

        static now() {
          return testDate.getTime();
        }
      } as DateConstructor;

      // 執行測試
      const result = await service.getDeviceStatistics();

      // 還原原始的 Date
      global.Date = RealDate;

      // 驗證結果
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.totalDevices).toBe(5);

      // 驗證設備類型分布
      expect(result.data.deviceTypeDistribution).toEqual({
        type1: 2,
        type2: 2,
        type3: 1,
      });

      // 驗證流量控制級別分布
      expect(result.data.flowControlDistribution).toEqual({
        high: 2,
        medium: 2,
        low: 1,
      });

      // 驗證時間分布
      expect(result.data.timeStats.devicesByAgeGroups).toEqual({
        lessThan1Days: 1, // 1個設備在今天
        lessThan7Days: 2, // 2個設備在7天內（3天前和6天前）
        lessThan30Days: 1, // 1個設備在30天內（15天前）
        moreThan30Days: 1, // 1個設備超過30天（40天前）
      });
    });

    it('should handle database error when getting statistics', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      jest.spyOn(deviceRepository, 'find').mockRejectedValue(new Error('Database error'));

      const result = await service.getDeviceStatistics();

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe(ErrorCode.INTERNAL_SERVER_ERROR);

      consoleSpy.mockRestore();
    });

    it('should handle empty device list', async () => {
      jest.spyOn(deviceRepository, 'find').mockResolvedValue([]);

      const result = await service.getDeviceStatistics();

      expect(result.success).toBe(true);
      expect(result.data.totalDevices).toBe(0);
      expect(result.data.connectionStatusDistribution).toEqual({
        connected: 0,
        disconnected: 0,
        unknown: 0,
      });
    });

    it('should handle devices with null/undefined values', async () => {
      const devicesWithNulls = [mockDeviceWithNulls];
      jest.spyOn(deviceRepository, 'find').mockResolvedValue(devicesWithNulls);

      const result = await service.getDeviceStatistics();

      expect(result.success).toBe(true);
      expect(result.data.deviceTypeDistribution).toHaveProperty('unspecified', 1);
      expect(result.data.flowControlDistribution).toEqual({
        high: 0,
        medium: 0,
        low: 0,
      });
    });
  });

  describe('deleteDeviceByDeviceId', () => {
    const deviceId = 'test-device-1';

    it('should delete device successfully', async () => {
      jest.spyOn(deviceRepository, 'findOne').mockResolvedValue(mockDevice);
      jest.spyOn(deviceRepository, 'remove').mockResolvedValue(mockDevice);

      const result = await service.deleteDeviceByDeviceId(deviceId);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Device deleted successfully');
      expect(deviceRepository.remove).toHaveBeenCalledWith(mockDevice);
    });

    it('should handle device not found', async () => {
      jest.spyOn(deviceRepository, 'findOne').mockResolvedValue(null);

      const result = await service.deleteDeviceByDeviceId(deviceId);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe(ErrorCode.DEVICE_NOT_FOUND);
      expect(deviceRepository.remove).not.toHaveBeenCalled();
    });

    it('should handle database error during deletion', async () => {
      jest.spyOn(deviceRepository, 'findOne').mockResolvedValue(mockDevice);
      jest.spyOn(deviceRepository, 'remove').mockRejectedValue(new Error('Database error'));

      const result = await service.deleteDeviceByDeviceId(deviceId);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
    });
  });

  describe('updateDevice', () => {
    const updateDto = {
      deviceName: 'Updated Device Name',
      flowControlLevel: FlowControlLevel.HIGH,
    };

    it('should update device successfully', async () => {
      const deviceToUpdate = { ...mockDevice };
      jest.spyOn(deviceRepository, 'findOne').mockResolvedValue(deviceToUpdate);
      jest.spyOn(deviceRepository, 'save').mockResolvedValue({
        ...deviceToUpdate,
        ...updateDto,
        updatedAt: expect.any(Date),
      });

      const result = await service.updateDevice('test-device-1', updateDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Device updated successfully');
      expect(result.data.deviceName).toBe(updateDto.deviceName);
      expect(result.data.flowControlLevel).toBe(updateDto.flowControlLevel);
    });

    it('should handle device not found', async () => {
      jest.spyOn(deviceRepository, 'findOne').mockResolvedValue(null);

      const result = await service.updateDevice('non-existent', updateDto);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe(ErrorCode.DEVICE_NOT_FOUND);
      expect(deviceRepository.save).not.toHaveBeenCalled();
    });

    it('should handle database error during update', async () => {
      const deviceToUpdate = { ...mockDevice };
      jest.spyOn(deviceRepository, 'findOne').mockResolvedValue(deviceToUpdate);
      jest.spyOn(deviceRepository, 'save').mockRejectedValue(new Error('Database error'));

      const result = await service.updateDevice('test-device-1', updateDto);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
    });
  });

  describe('updateOrCreateDevice', () => {
    const deviceData = {
      deviceId: 'test-device-1',
      deviceName: 'Updated Device',
      flowControlLevel: FlowControlLevel.HIGH,
    };

    it('should create new device if not exists', async () => {
      jest.spyOn(deviceRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(deviceRepository, 'create').mockReturnValue({ ...mockDevice, ...deviceData });
      jest.spyOn(deviceRepository, 'save').mockResolvedValue({ ...mockDevice, ...deviceData });

      const result = await service.updateOrCreateDevice(deviceData);

      expect(deviceRepository.create).toHaveBeenCalled();
      expect(result.deviceName).toBe(deviceData.deviceName);
      expect(result.status).toBe('unknown');
    });

    it('should update existing device', async () => {
      jest.spyOn(deviceRepository, 'findOne').mockResolvedValue(mockDevice);
      jest.spyOn(deviceRepository, 'save').mockResolvedValue({ ...mockDevice, ...deviceData });

      const result = await service.updateOrCreateDevice(deviceData);

      expect(deviceRepository.create).not.toHaveBeenCalled();
      expect(result.deviceName).toBe(deviceData.deviceName);
    });

    it('should calculate correct status for both cases', async () => {
      // Test for a new unregistered device
      jest.spyOn(deviceRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(deviceRepository, 'create').mockReturnValue(mockDevice);
      jest.spyOn(deviceRepository, 'save').mockResolvedValue(mockDevice);

      let result = await service.updateOrCreateDevice({ deviceId: 'new-device' });
      expect(result.status).toBe('unknown');

      // Test for an existing registered and authenticated device
      jest.spyOn(deviceRepository, 'findOne').mockResolvedValue(mockAuthenticatedDevice);
      jest.spyOn(deviceRepository, 'save').mockResolvedValue(mockAuthenticatedDevice);

      result = await service.updateOrCreateDevice({ deviceId: 'test-device-1' });
      expect(result.status).toBe('connected');
    });
  });

  describe('Connection Status Handling', () => {
    it('should handle different connection states correctly', async () => {
      // Test different connection states
      const now = new Date();
      const lastAuth = new Date(now.getTime() - 2 * 60 * 1000); // 2 minutes ago

      const unregisteredDevice = { ...mockDevice, isRegistered: false };
      const registeredDevice = { ...mockDevice, isRegistered: true, lastAuthenticated: null };
      const authenticatedDevice = {
        ...mockDevice,
        isRegistered: true,
        lastAuthenticated: lastAuth,
      };

      jest.spyOn(deviceRepository, 'save').mockResolvedValueOnce(unregisteredDevice);

      const unregisteredStatus = service['getDeviceConnectionStatus'](unregisteredDevice, now);
      const registeredStatus = service['getDeviceConnectionStatus'](registeredDevice, now);
      const authenticatedStatus = service['getDeviceConnectionStatus'](authenticatedDevice, now);

      expect(unregisteredStatus).toBe('unknown');
      expect(registeredStatus).toBe('disconnected');
      expect(authenticatedStatus).toBe('connected');
    });
  });
});
