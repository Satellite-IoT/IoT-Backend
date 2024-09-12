import { Test, TestingModule } from '@nestjs/testing';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';
import { CryptoService } from './crypto.service';
import { HttpException } from '@nestjs/common';
import { createApiResponse } from '../common/utils/response.util';
import { ErrorCode } from '../common/enums/error-codes.enum';
import { Device } from '../entities/device.entity';

describe('DevicesController', () => {
  let controller: DevicesController;
  let devicesService: DevicesService;
  let cryptoService: CryptoService;

  const mockDevice: Device = {
    id: 1,
    deviceId: 'testDeviceId',
    publicKey: 'testPublicKey',
    deviceType: 'testType',
    isAuthenticated: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DevicesController],
      providers: [
        {
          provide: DevicesService,
          useValue: {
            register: jest.fn(),
            authenticate: jest.fn(),
            getDeviceList: jest.fn(),
            getDeviceById: jest.fn(),
            getDeviceByDeviceId: jest.fn(),
          },
        },
        {
          provide: CryptoService,
          useValue: {
            generateKeyPair: jest.fn(),
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<DevicesController>(DevicesController);
    devicesService = module.get<DevicesService>(DevicesService);
    cryptoService = module.get<CryptoService>(CryptoService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register a device successfully', async () => {
      const registerDto = { deviceId: 'test', publicKey: 'testKey' };
      const mockResult = { success: true, message: 'Device registered', data: mockDevice };
      jest.spyOn(devicesService, 'register').mockResolvedValue(mockResult);

      const result = await controller.register(registerDto);

      expect(result).toEqual(createApiResponse(mockResult));
      expect(devicesService.register).toHaveBeenCalledWith(registerDto);
    });

    it('should throw HttpException when registration fails', async () => {
      const registerDto = { deviceId: 'test', publicKey: 'testKey' };
      const mockResult = { success: false, message: 'Registration failed', errorCode: ErrorCode.DEVICE_ALREADY_EXISTS };
      jest.spyOn(devicesService, 'register').mockResolvedValue(mockResult);

      await expect(controller.register(registerDto)).rejects.toThrow(HttpException);
      expect(devicesService.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('authenticate', () => {
    it('should authenticate a device successfully', async () => {
      const authDto = { deviceId: 'test', deviceType: 'type', signature: 'sig' };
      const mockResult = { success: true, message: 'Device authenticated' };
      jest.spyOn(devicesService, 'authenticate').mockResolvedValue(mockResult);

      const result = await controller.authenticate(authDto);

      expect(result).toEqual(createApiResponse(mockResult));
      expect(devicesService.authenticate).toHaveBeenCalledWith(authDto);
    });

    it('should throw HttpException when authentication fails', async () => {
      const authDto = { deviceId: 'test', deviceType: 'type', signature: 'sig' };
      const mockResult = {
        success: false,
        message: 'Authentication failed',
        errorCode: ErrorCode.AUTHENTICATION_FAILED,
      };
      jest.spyOn(devicesService, 'authenticate').mockResolvedValue(mockResult);

      await expect(controller.authenticate(authDto)).rejects.toThrow(HttpException);
      expect(devicesService.authenticate).toHaveBeenCalledWith(authDto);
    });
  });

  describe('getDeviceList', () => {
    it('should return a list of devices', async () => {
      const mockResult = { success: true, message: 'Devices retrieved', data: [mockDevice] };
      jest.spyOn(devicesService, 'getDeviceList').mockResolvedValue(mockResult);

      const result = await controller.getDeviceList();

      expect(result).toEqual(createApiResponse(mockResult));
      expect(devicesService.getDeviceList).toHaveBeenCalled();
    });

    it('should throw HttpException when retrieval fails', async () => {
      const mockResult = { success: false, message: 'Retrieval failed', errorCode: ErrorCode.INTERNAL_SERVER_ERROR };
      jest.spyOn(devicesService, 'getDeviceList').mockResolvedValue(mockResult);

      await expect(controller.getDeviceList()).rejects.toThrow(HttpException);
      expect(devicesService.getDeviceList).toHaveBeenCalled();
    });
  });

  describe('getDeviceById', () => {
    it('should return a device by id', async () => {
      const mockResult = { success: true, message: 'Device retrieved', data: mockDevice };
      jest.spyOn(devicesService, 'getDeviceById').mockResolvedValue(mockResult);

      const result = await controller.getDeviceById('1');

      expect(result).toEqual(createApiResponse(mockResult));
      expect(devicesService.getDeviceById).toHaveBeenCalledWith(1);
    });

    it('should throw HttpException when device is not found', async () => {
      const mockResult = { success: false, message: 'Device not found', errorCode: ErrorCode.DEVICE_NOT_FOUND };
      jest.spyOn(devicesService, 'getDeviceById').mockResolvedValue(mockResult);

      await expect(controller.getDeviceById('1')).rejects.toThrow(HttpException);
      expect(devicesService.getDeviceById).toHaveBeenCalledWith(1);
    });
  });

  describe('getDeviceByDeviceId', () => {
    it('should return a device by deviceId', async () => {
      const mockResult = { success: true, message: 'Device retrieved', data: mockDevice };
      jest.spyOn(devicesService, 'getDeviceByDeviceId').mockResolvedValue(mockResult);

      const result = await controller.getDeviceByDeviceId('test');

      expect(result).toEqual(createApiResponse(mockResult));
      expect(devicesService.getDeviceByDeviceId).toHaveBeenCalledWith('test');
    });

    it('should throw HttpException when device is not found', async () => {
      const mockResult = { success: false, message: 'Device not found', errorCode: ErrorCode.DEVICE_NOT_FOUND };
      jest.spyOn(devicesService, 'getDeviceByDeviceId').mockResolvedValue(mockResult);

      await expect(controller.getDeviceByDeviceId('test')).rejects.toThrow(HttpException);
      expect(devicesService.getDeviceByDeviceId).toHaveBeenCalledWith('test');
    });
  });
});
