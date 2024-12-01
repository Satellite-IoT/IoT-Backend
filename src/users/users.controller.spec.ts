import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { LoggerService } from '../logger/logger.service';
import { createApiResponse } from '../common/utils/response.util';
import { User } from '../entities';
import { ErrorCode, FlowControlLevel, UserListSortField, SortOrder, AccountRole } from '../common/enums';
import { GetUserListDto, UpdateUserDto } from './dto';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;
  let logger: LoggerService;

  const mockUsersService = {
    getUserList: jest.fn(),
    getUserById: jest.fn(),
    updateUser: jest.fn(),
  };

  const mockLoggerService = {
    log: jest.fn(),
    error: jest.fn(),
  };

  const mockUser: User = {
    id: 1,
    username: 'testuser',
    password: 'hashedpassword',
    email: 'test@example.com',
    name: 'Test User',
    role: AccountRole.USER,
    flowControlLevel: FlowControlLevel.MEDIUM,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    hashPassword: jest.fn(),
    validatePassword: jest.fn(),
    beforeInsert: jest.fn(),
    beforeUpdate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
    logger = module.get<LoggerService>(LoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getUserList', () => {
    const mockGetUserListDto: GetUserListDto = {
      page: 1,
      limit: 10,
      sortBy: UserListSortField.ID,
      sortOrder: SortOrder.ASC,
    };

    it('should return users list successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Users retrieved successfully',
        data: {
          users: [mockUser],
          total: 1,
        },
      };

      mockUsersService.getUserList.mockResolvedValue(mockResponse);

      const result = await controller.getUserList(mockGetUserListDto);

      expect(service.getUserList).toHaveBeenCalledWith(mockGetUserListDto);
      expect(result).toEqual(createApiResponse(mockResponse));
    });

    it('should use default pagination values', async () => {
      // 創建一個新的 GetUserListDto 實例，它會使用定義在類中的預設值
      const dto = new GetUserListDto();

      mockUsersService.getUserList.mockResolvedValue({
        success: true,
        message: 'Users retrieved successfully',
        data: { users: [], total: 0 },
      });

      await controller.getUserList(dto);

      expect(mockUsersService.getUserList).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        sortBy: UserListSortField.ID,
        sortOrder: SortOrder.ASC,
      });
    });

    it('should throw HttpException when service fails', async () => {
      const mockErrorResponse = {
        success: false,
        message: 'Failed to retrieve users',
        errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
      };

      mockUsersService.getUserList.mockResolvedValue(mockErrorResponse);

      await expect(controller.getUserList(mockGetUserListDto)).rejects.toThrow(HttpException);
    });
  });

  describe('getUserById', () => {
    const userId = 1;

    it('should return user successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'User found',
        data: mockUser,
      };

      mockUsersService.getUserById.mockResolvedValue(mockResponse);

      const result = await controller.getUserById(userId);

      expect(service.getUserById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(createApiResponse(mockResponse));
    });

    it('should throw HttpException when user not found', async () => {
      const mockErrorResponse = {
        success: false,
        message: 'User not found',
        errorCode: ErrorCode.USER_NOT_FOUND,
      };

      mockUsersService.getUserById.mockResolvedValue(mockErrorResponse);

      await expect(controller.getUserById(userId)).rejects.toThrow(HttpException);
    });
  });

  describe('updateUser', () => {
    const userId = 1;
    const mockUpdateUserDto: UpdateUserDto = {
      name: 'Updated User',
      username: 'updateduser',
      flowControlLevel: FlowControlLevel.HIGH,
    };

    it('should update user successfully', async () => {
      const updatedUser = {
        ...mockUser,
        ...mockUpdateUserDto,
        updatedAt: new Date(),
      };

      const mockResponse = {
        success: true,
        message: 'User updated successfully',
        data: updatedUser,
      };

      mockUsersService.updateUser.mockResolvedValue(mockResponse);

      const result = await controller.updateUser(userId, mockUpdateUserDto);

      expect(service.updateUser).toHaveBeenCalledWith(userId, mockUpdateUserDto);
      expect(logger.log).toHaveBeenCalledTimes(2);
      expect(result).toEqual(createApiResponse(mockResponse));
    });

    it('should throw HttpException when update fails', async () => {
      const mockErrorResponse = {
        success: false,
        message: 'User not found',
        errorCode: ErrorCode.USER_NOT_FOUND,
      };

      mockUsersService.updateUser.mockResolvedValue(mockErrorResponse);

      await expect(controller.updateUser(userId, mockUpdateUserDto)).rejects.toThrow(HttpException);
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle partial updates', async () => {
      const partialUpdateDto: Partial<UpdateUserDto> = {
        name: 'Updated Name',
      };

      const mockResponse = {
        success: true,
        message: 'User updated successfully',
        data: {
          ...mockUser,
          name: partialUpdateDto.name,
        },
      };

      mockUsersService.updateUser.mockResolvedValue(mockResponse);

      const result = await controller.updateUser(userId, partialUpdateDto as UpdateUserDto);

      expect(service.updateUser).toHaveBeenCalledWith(userId, partialUpdateDto);
      expect(result).toEqual(createApiResponse(mockResponse));
    });
  });
});
