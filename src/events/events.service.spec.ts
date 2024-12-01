import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Event } from 'src/entities';
import { EventLevel, EventTag, EventType } from 'src/common/enums';
import { CreateEventDto } from './dto';
import { EventContext } from './types/event-context.interface';

describe('EventsService', () => {
  let service: EventsService;

  const mockEventRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: getRepositoryToken(Event),
          useValue: mockEventRepository,
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createEvent', () => {
    it('should create an event with all fields', async () => {
      const createEventDto: CreateEventDto = {
        level: EventLevel.INFO,
        type: EventType.DEVICE_REGISTRATION,
        tag: EventTag.DEVICE,
        message: 'Device connected.',
        details: 'Device 1 successfully connected on 192.168.1.100',
        context: {
          deviceId: 'device-1',
          deviceName: 'Device 1',
          ipAddr: '192.168.1.100', // 修正: ipAddress -> ipAddr
        },
      };

      const createdEvent = {
        id: 1,
        createdAt: new Date(),
        ...createEventDto,
      };

      mockEventRepository.create.mockReturnValue(createdEvent);
      mockEventRepository.save.mockResolvedValue(createdEvent);

      const result = await service.createEvent(createEventDto);

      expect(result).toEqual(createdEvent);
      expect(mockEventRepository.create).toHaveBeenCalledWith(createEventDto);
      expect(mockEventRepository.save).toHaveBeenCalledWith(createdEvent);
    });

    it('should create an event with only required fields', async () => {
      const createEventDto: CreateEventDto = {
        level: EventLevel.INFO,
        type: EventType.DEVICE_REGISTRATION,
        tag: EventTag.DEVICE,
        message: 'Device connected.',
      };

      const createdEvent = {
        id: 1,
        createdAt: new Date(),
        ...createEventDto,
      };

      mockEventRepository.create.mockReturnValue(createdEvent);
      mockEventRepository.save.mockResolvedValue(createdEvent);

      const result = await service.createEvent(createEventDto);

      expect(result).toEqual(createdEvent);
      expect(mockEventRepository.create).toHaveBeenCalledWith(createEventDto);
      expect(mockEventRepository.save).toHaveBeenCalledWith(createdEvent);
    });

    it('should handle save error', async () => {
      const createEventDto: CreateEventDto = {
        level: EventLevel.ERROR,
        type: EventType.DEVICE_REGISTRATION,
        tag: EventTag.DEVICE,
        message: 'Connection failed.',
      };

      const error = new Error('Database error');
      mockEventRepository.save.mockRejectedValue(error);

      await expect(service.createEvent(createEventDto)).rejects.toThrow(error);
    });
  });
});
