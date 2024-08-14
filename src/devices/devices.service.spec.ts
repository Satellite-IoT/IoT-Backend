import { Test, TestingModule } from '@nestjs/testing';
import { DevicesService } from './devices.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Device } from '../entities/device.entity';
import { CryptoService } from './crypto.service';
import { Repository } from 'typeorm';

describe('DevicesService', () => {
  let service: DevicesService;
  let deviceRepository: Repository<Device>;
  let cryptoService: CryptoService;

  const mockDevice = (deviceId: string, publicKey: string): Device => ({
    id: 1,
    deviceId,
    publicKey,
    deviceType: 'testType',
    isAuthenticated: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DevicesService,
        {
          provide: getRepositoryToken(Device),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
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

    service = module.get<DevicesService>(DevicesService);
    deviceRepository = module.get<Repository<Device>>(getRepositoryToken(Device));
    cryptoService = module.get<CryptoService>(CryptoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new device', async () => {
      const registerDto = { publicKey: 'testKey', deviceId: 'testId' };
      const createdDevice = mockDevice(registerDto.deviceId, registerDto.publicKey);

      jest.spyOn(deviceRepository, 'create').mockReturnValue(createdDevice);
      jest.spyOn(deviceRepository, 'save').mockResolvedValue(createdDevice);

      const result = await service.register(registerDto);

      expect(result).toEqual({
        success: true,
        message: 'Device registered successfully',
        data: createdDevice,
      });
      expect(deviceRepository.create).toHaveBeenCalledWith(registerDto);
      expect(deviceRepository.save).toHaveBeenCalledWith(createdDevice);
    });

    it('should return an error if device already exists', async () => {
      const registerDto = { publicKey: 'testKey', deviceId: 'testId' };
      const existingDevice = mockDevice(registerDto.deviceId, registerDto.publicKey);

      jest.spyOn(deviceRepository, 'findOne').mockResolvedValue(existingDevice);

      const result = await service.register(registerDto);

      expect(result).toEqual({
        success: false,
        message: 'Device ID already exists',
        errorCode: 'DEVICE_ALREADY_EXISTS',
      });
      expect(deviceRepository.findOne).toHaveBeenCalledWith({ where: { deviceId: registerDto.deviceId } });
    });
  });

  describe('authenticate', () => {
    it('should authenticate a device successfully', async () => {
      const authDto = { deviceId: 'testId', deviceType: 'testType', signature: 'testSignature' };
      const existingDevice = mockDevice(authDto.deviceId, 'testPublicKey');

      jest.spyOn(deviceRepository, 'findOne').mockResolvedValue(existingDevice);
      jest.spyOn(cryptoService, 'verify').mockReturnValue(true);
      jest.spyOn(deviceRepository, 'save').mockResolvedValue({ ...existingDevice, isAuthenticated: true });

      const result = await service.authenticate(authDto);

      expect(result).toEqual({ success: true, message: 'Device authenticated successfully' });
      expect(deviceRepository.findOne).toHaveBeenCalledWith({ where: { deviceId: authDto.deviceId } });
      expect(cryptoService.verify).toHaveBeenCalled();
      expect(deviceRepository.save).toHaveBeenCalledWith({ ...existingDevice, isAuthenticated: true });
    });

    it('should fail authentication if device not found', async () => {
      const authDto = { deviceId: 'testId', deviceType: 'testType', signature: 'testSignature' };

      jest.spyOn(deviceRepository, 'findOne').mockResolvedValue(null);

      const result = await service.authenticate(authDto);

      expect(result).toEqual({ success: false, message: 'Device not found', errorCode: 'DEVICE_NOT_FOUND' });
      expect(deviceRepository.findOne).toHaveBeenCalledWith({ where: { deviceId: authDto.deviceId } });
    });

    it('should fail authentication if signature is invalid', async () => {
      const authDto = { deviceId: 'testId', deviceType: 'testType', signature: 'testSignature' };
      const existingDevice = mockDevice(authDto.deviceId, 'testPublicKey');

      jest.spyOn(deviceRepository, 'findOne').mockResolvedValue(existingDevice);
      jest.spyOn(cryptoService, 'verify').mockReturnValue(false);

      const result = await service.authenticate(authDto);

      expect(result).toEqual({ success: false, message: 'Authentication failed', errorCode: 'AUTHENTICATION_FAILED' });
      expect(deviceRepository.findOne).toHaveBeenCalledWith({ where: { deviceId: authDto.deviceId } });
      expect(cryptoService.verify).toHaveBeenCalled();
    });
  });
});
