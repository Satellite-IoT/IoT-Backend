import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User } from '../entities';
import { ErrorCode, FlowControlLevel, UserListSortField, SortOrder, AccountRole } from '../common/enums';
import { GetUserListDto, UpdateUserDto } from './dto';

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;

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

  const mockRepository = {
    createQueryBuilder: jest.fn(),
    findOne: jest.fn(),
    exist: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserList', () => {
    describe('sorting', () => {
      it.each([
        [UserListSortField.ID, SortOrder.ASC],
        [UserListSortField.ID, SortOrder.DESC],
        [UserListSortField.CREATED_AT, SortOrder.ASC],
        [UserListSortField.CREATED_AT, SortOrder.DESC],
        [UserListSortField.UPDATED_AT, SortOrder.ASC],
        [UserListSortField.UPDATED_AT, SortOrder.DESC],
      ])('should handle sorting by %s in %s order', async (sortBy, sortOrder) => {
        const dto: GetUserListDto = {
          page: 1,
          limit: 10,
          sortBy,
          sortOrder,
        };

        const mockQueryBuilder = {
          orderBy: jest.fn().mockReturnThis(),
          addOrderBy: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          take: jest.fn().mockReturnThis(),
          getManyAndCount: jest.fn().mockResolvedValue([[mockUser], 1]),
        };

        mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

        await service.getUserList(dto);

        if (['createdAt', 'updatedAt'].includes(sortBy)) {
          expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
            `CASE WHEN users.${sortBy} IS NULL THEN 1 ELSE 0 END`,
            'ASC',
          );
          expect(mockQueryBuilder.addOrderBy).toHaveBeenCalledWith(`users.${sortBy}`, sortOrder);
        } else {
          expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(`users.${sortBy}`, sortOrder);
        }
      });
    });

    it('should handle pagination correctly', async () => {
      const dto: GetUserListDto = {
        page: 2,
        limit: 5,
        sortBy: UserListSortField.ID,
        sortOrder: SortOrder.ASC,
      };

      const mockQueryBuilder = {
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockUser], 1]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.getUserList(dto);

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(5); // (page-1) * limit
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(5);
    });
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.getUserById(1);

      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual({
        success: true,
        message: 'User found',
        data: mockUser,
      });
    });

    it('should return error when user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.getUserById(999);

      expect(result).toEqual({
        success: false,
        message: 'User not found',
        errorCode: ErrorCode.USER_NOT_FOUND,
      });
    });
  });

  describe('updateUser', () => {
    const updateDto: UpdateUserDto = {
      name: 'Updated Name',
      username: 'newusername',
      flowControlLevel: FlowControlLevel.HIGH,
    };

    it('should update user successfully with valid data', async () => {
      const updatedUser = { ...mockUser, ...updateDto };
      mockRepository.exist.mockResolvedValue(true);
      mockRepository.update.mockResolvedValue(undefined);
      mockRepository.findOne.mockResolvedValue(updatedUser);

      const result = await service.updateUser(1, updateDto);

      expect(repository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          name: updateDto.name,
          username: updateDto.username,
          flowControlLevel: updateDto.flowControlLevel,
          updatedAt: expect.any(Date),
        }),
      );
      expect(result).toEqual({
        success: true,
        message: 'User updated successfully',
        data: updatedUser,
      });
    });

    it('should filter out non-allowed fields', async () => {
      const dtoWithExtraFields = {
        ...updateDto,
        email: 'newemail@test.com', // should be filtered out
        role: AccountRole.ADMIN, // should be filtered out
      };

      mockRepository.exist.mockResolvedValue(true);
      mockRepository.update.mockResolvedValue(undefined);
      mockRepository.findOne.mockResolvedValue(mockUser);

      await service.updateUser(1, dtoWithExtraFields as UpdateUserDto);

      expect(repository.update).toHaveBeenCalledWith(
        1,
        expect.not.objectContaining({
          email: 'newemail@test.com',
          role: AccountRole.ADMIN,
        }),
      );
    });

    it('should return error when user not found', async () => {
      mockRepository.exist.mockResolvedValue(false);

      const result = await service.updateUser(999, updateDto);

      expect(result).toEqual({
        success: false,
        message: 'User not found',
        errorCode: ErrorCode.USER_NOT_FOUND,
      });
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should handle database errors during update', async () => {
      const updateDto: UpdateUserDto = {
        name: 'Updated Name',
        username: 'newusername',
        flowControlLevel: FlowControlLevel.HIGH,
      };

      mockRepository.exist.mockResolvedValue(true);
      mockRepository.update.mockRejectedValue(new Error('Database error'));

      const result = await service.updateUser(1, updateDto);

      expect(result).toEqual({
        success: false,
        message: 'Failed to update user',
        errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
      });
    });

    it('should handle partial updates', async () => {
      const partialUpdateDto: Partial<UpdateUserDto> = {
        name: 'Updated Name',
      };

      mockRepository.exist.mockResolvedValue(true);
      mockRepository.update.mockResolvedValue(undefined);
      mockRepository.findOne.mockResolvedValue({ ...mockUser, ...partialUpdateDto });

      const result = await service.updateUser(1, partialUpdateDto as UpdateUserDto);

      expect(repository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          name: partialUpdateDto.name,
          updatedAt: expect.any(Date),
        }),
      );
      expect(result.success).toBe(true);
      expect(result.data).toEqual(
        expect.objectContaining({
          name: partialUpdateDto.name,
        }),
      );
    });

    it('should update updatedAt timestamp', async () => {
      const beforeUpdate = new Date();
      mockRepository.exist.mockResolvedValue(true);
      mockRepository.update.mockResolvedValue(undefined);
      mockRepository.findOne.mockImplementation(async () => ({
        ...mockUser,
        name: updateDto.name,
        updatedAt: new Date(),
      }));

      await service.updateUser(1, updateDto);

      expect(repository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          updatedAt: expect.any(Date),
        }),
      );

      const updateCall = mockRepository.update.mock.calls[0][1];
      expect(updateCall.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
    });
  });
});
