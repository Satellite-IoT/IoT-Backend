import { Test, TestingModule } from '@nestjs/testing';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';
import { CryptoService } from './crypto.service';
import { LoggerService } from 'src/logger/logger.service';
import { RegisterDeviceDto, AuthenticateDeviceDto, UpdateDeviceDto, GetDeviceListDto } from './dto';
import { HttpException } from '@nestjs/common';
import { ErrorCode, FlowControlLevel, SortField, SortOrder } from 'src/common/enums';
import { Device } from 'src/entities';

describe('DevicesController', () => {
  let controller: DevicesController;
  let devicesService: DevicesService;
  let cryptoService: CryptoService;
  let loggerService: LoggerService;

  // Mock Data
  const mockDevice: Partial<Device> = {
    id: 1,
    deviceId: 'test-device-1',
    publicKey: 'test-public-key',
    deviceType: 'test-type',
    deviceName: 'Test Device',
    flowControlLevel: FlowControlLevel.MEDIUM,
    status: 'disconnected',
    isRegistered: true,
    isAuthenticated: false,
  };

  // Mock Services
  const mockDevicesService = {
    register: jest.fn(),
    authenticate: jest.fn(),
    getDeviceList: jest.fn(),
    getDeviceStatistics: jest.fn(),
    getDeviceById: jest.fn(),
    getDeviceByDeviceId: jest.fn(),
    updateDevice: jest.fn(),
    deleteDeviceByDeviceId: jest.fn(),
  };

  const mockCryptoService = {
    verify: jest.fn(),
  };

  const mockLoggerService = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DevicesController],
      providers: [
        {
          provide: DevicesService,
          useValue: mockDevicesService,
        },
        {
          provide: CryptoService,
          useValue: mockCryptoService,
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    controller = module.get<DevicesController>(DevicesController);
    devicesService = module.get<DevicesService>(DevicesService);
    cryptoService = module.get<CryptoService>(CryptoService);
    loggerService = module.get<LoggerService>(LoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const mockRegisterDto: RegisterDeviceDto = {
      deviceId: 'test-device-1',
      deviceName: 'Test Device',
      publicKey: 'MCowBQYDK2VwAyEASxPsG2JBYir64Cxo92ZDSBiwxrVYN2U75NpvY/v4agc=',
      flowControlLevel: FlowControlLevel.MEDIUM,
      ipAddr: '192.168.1.100',
    };

    it('should successfully register a device', async () => {
      const successResponse = {
        success: true,
        message: 'Device registered successfully',
        data: { ...mockDevice },
      };

      mockDevicesService.register.mockResolvedValue(successResponse);

      const result = await controller.register(mockRegisterDto);

      expect(mockDevicesService.register).toHaveBeenCalledWith(mockRegisterDto);
      expect(result).toEqual({
        success: true,
        message: successResponse.message,
        data: successResponse.data,
      });
      expect(mockLoggerService.log).toHaveBeenCalled();
    });

    it('should throw HttpException when registration fails', async () => {
      const errorResponse = {
        success: false,
        message: 'Registration failed',
        errorCode: ErrorCode.DEVICE_ALREADY_REGISTERED,
      };

      mockDevicesService.register.mockResolvedValue(errorResponse);

      await expect(controller.register(mockRegisterDto)).rejects.toThrow(HttpException);
      expect(mockLoggerService.error).toHaveBeenCalled();
    });
  });

  describe('authenticate', () => {
    const mockAuthDto: AuthenticateDeviceDto = {
      deviceId: 'test-device-1',
      signature: 'test-signature',
      deviceType: 'test-type',
      ipAddr: '192.168.1.100',
    };

    it('should successfully authenticate a device', async () => {
      const successResponse = {
        success: true,
        message: 'Device authenticated successfully',
      };

      mockDevicesService.authenticate.mockResolvedValue(successResponse);

      const result = await controller.authenticate(mockAuthDto);

      expect(mockDevicesService.authenticate).toHaveBeenCalledWith(mockAuthDto);
      expect(result).toEqual({
        success: true,
        message: successResponse.message,
      });
      expect(mockLoggerService.log).toHaveBeenCalled();
    });

    it('should throw HttpException when authentication fails', async () => {
      const errorResponse = {
        success: false,
        message: 'Authentication failed',
        errorCode: ErrorCode.AUTHENTICATION_FAILED,
      };

      mockDevicesService.authenticate.mockResolvedValue(errorResponse);

      await expect(controller.authenticate(mockAuthDto)).rejects.toThrow(HttpException);
      expect(mockLoggerService.warn).toHaveBeenCalled();
    });
  });

  describe('getDeviceList', () => {
    const mockQuery: GetDeviceListDto = {
      page: 1,
      limit: 10,
      sortBy: SortField.CREATED_AT,
      sortOrder: SortOrder.DESC,
    };

    it('should return list of devices successfully', async () => {
      const mockDevices = [{ ...mockDevice }, { ...mockDevice, id: 2, deviceId: 'device-2' }];

      const successResponse = {
        success: true,
        message: 'Devices retrieved successfully',
        data: {
          devices: mockDevices,
          total: 2,
        },
      };

      mockDevicesService.getDeviceList.mockResolvedValue(successResponse);

      const result = await controller.getDeviceList(mockQuery);

      expect(mockDevicesService.getDeviceList).toHaveBeenCalledWith(mockQuery);
      expect(result).toEqual({
        success: true,
        message: successResponse.message,
        data: successResponse.data,
      });
    });

    it('should handle different sort fields', async () => {
      const differentSortQueries = [
        { ...mockQuery, sortBy: SortField.ID },
        { ...mockQuery, sortBy: SortField.DEVICE_ID },
        { ...mockQuery, sortBy: SortField.LAST_AUTHENTICATED },
      ];

      for (const query of differentSortQueries) {
        const successResponse = {
          success: true,
          message: 'Devices retrieved successfully',
          data: {
            devices: [mockDevice],
            total: 1,
          },
        };

        mockDevicesService.getDeviceList.mockResolvedValue(successResponse);

        const result = await controller.getDeviceList(query);
        expect(result.success).toBe(true);
        expect(mockDevicesService.getDeviceList).toHaveBeenCalledWith(query);
      }
    });

    it('should throw HttpException when device list retrieval fails', async () => {
      const errorResponse = {
        success: false,
        message: 'Failed to retrieve devices',
        errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
      };

      mockDevicesService.getDeviceList.mockResolvedValue(errorResponse);

      await expect(controller.getDeviceList(mockQuery)).rejects.toThrow(HttpException);
    });
  });

  describe('getDeviceStatistics', () => {
    it('should return device statistics successfully', async () => {
      const mockStats = {
        totalDevices: 10,
        registeredDevices: 8,
        authenticatedDevices: 6,
        recentlyAddedDevices: 2,
        connectionStatusDistribution: {
          connected: 5,
          disconnected: 3,
          unknown: 2,
        },
        deviceTypeDistribution: {
          'type-a': 5,
          'type-b': 5,
        },
        flowControlDistribution: {
          high: 3,
          medium: 4,
          low: 3,
        },
      };

      const successResponse = {
        success: true,
        message: 'Statistics retrieved successfully',
        data: mockStats,
      };

      mockDevicesService.getDeviceStatistics.mockResolvedValue(successResponse);

      const result = await controller.getDeviceStatistics();

      expect(result).toEqual({
        success: true,
        message: successResponse.message,
        data: mockStats,
      });
    });

    it('should throw HttpException when statistics retrieval fails', async () => {
      const errorResponse = {
        success: false,
        message: 'Failed to retrieve statistics',
        errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
      };

      mockDevicesService.getDeviceStatistics.mockResolvedValue(errorResponse);

      await expect(controller.getDeviceStatistics()).rejects.toThrow(HttpException);
    });
  });

  describe('getDeviceById', () => {
    const deviceId = '1';

    it('should return device successfully', async () => {
      const successResponse = {
        success: true,
        message: 'Device found',
        data: mockDevice,
      };

      mockDevicesService.getDeviceById.mockResolvedValue(successResponse);

      const result = await controller.getDeviceById(deviceId);

      expect(mockDevicesService.getDeviceById).toHaveBeenCalledWith(+deviceId);
      expect(result).toEqual({
        success: true,
        message: successResponse.message,
        data: successResponse.data,
      });
    });

    it('should throw HttpException when device not found', async () => {
      const errorResponse = {
        success: false,
        message: 'Device not found',
        errorCode: ErrorCode.DEVICE_NOT_FOUND,
      };

      mockDevicesService.getDeviceById.mockResolvedValue(errorResponse);

      await expect(controller.getDeviceById(deviceId)).rejects.toThrow(HttpException);
    });
  });

  describe('updateDevice', () => {
    const deviceId = 'test-device-1';
    const mockUpdateDto: UpdateDeviceDto = {
      deviceName: 'Updated Device',
      flowControlLevel: FlowControlLevel.HIGH,
    };

    it('should successfully update a device', async () => {
      const successResponse = {
        success: true,
        message: 'Device updated successfully',
        data: { ...mockDevice, ...mockUpdateDto },
      };

      mockDevicesService.updateDevice.mockResolvedValue(successResponse);

      const result = await controller.updateDevice(deviceId, mockUpdateDto);

      expect(mockDevicesService.updateDevice).toHaveBeenCalledWith(deviceId, mockUpdateDto);
      expect(result).toEqual({
        success: true,
        message: successResponse.message,
        data: successResponse.data,
      });
      expect(mockLoggerService.log).toHaveBeenCalled();
    });

    it('should throw HttpException when update fails', async () => {
      const errorResponse = {
        success: false,
        message: 'Update failed',
        errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
      };

      mockDevicesService.updateDevice.mockResolvedValue(errorResponse);

      await expect(controller.updateDevice(deviceId, mockUpdateDto)).rejects.toThrow(HttpException);
      expect(mockLoggerService.error).toHaveBeenCalled();
    });
  });

  describe('deleteDeviceByDeviceId', () => {
    const deviceId = 'test-device-1';

    it('should successfully delete a device', async () => {
      const successResponse = {
        success: true,
        message: 'Device deleted successfully',
      };

      mockDevicesService.deleteDeviceByDeviceId.mockResolvedValue(successResponse);

      const result = await controller.deleteDeviceByDeviceId(deviceId);

      expect(mockDevicesService.deleteDeviceByDeviceId).toHaveBeenCalledWith(deviceId);
      expect(result).toEqual({
        success: true,
        message: successResponse.message,
      });
      expect(mockLoggerService.log).toHaveBeenCalled();
    });

    it('should throw HttpException when delete fails', async () => {
      const errorResponse = {
        success: false,
        message: 'Device not found',
        errorCode: ErrorCode.DEVICE_NOT_FOUND,
      };

      mockDevicesService.deleteDeviceByDeviceId.mockResolvedValue(errorResponse);

      await expect(controller.deleteDeviceByDeviceId(deviceId)).rejects.toThrow(HttpException);
      expect(mockLoggerService.error).toHaveBeenCalled();
    });
  });

  describe('getDeviceByDeviceId', () => {
    const deviceId = 'test-device-1';

    it('should return device successfully', async () => {
      const successResponse = {
        success: true,
        message: 'Device found',
        data: mockDevice,
      };

      mockDevicesService.getDeviceByDeviceId.mockResolvedValue(successResponse);

      const result = await controller.getDeviceByDeviceId(deviceId);

      expect(mockDevicesService.getDeviceByDeviceId).toHaveBeenCalledWith(deviceId);
      expect(result).toEqual({
        success: true,
        message: successResponse.message,
        data: successResponse.data,
      });
    });

    it('should throw HttpException when device not found', async () => {
      const errorResponse = {
        success: false,
        message: 'Device not found',
        errorCode: ErrorCode.DEVICE_NOT_FOUND,
      };

      mockDevicesService.getDeviceByDeviceId.mockResolvedValue(errorResponse);

      await expect(controller.getDeviceByDeviceId(deviceId)).rejects.toThrow(HttpException);
    });
  });
});
