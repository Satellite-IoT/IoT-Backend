import { Injectable } from '@nestjs/common';
import { User } from 'src/entities';
import { ErrorCode, UserListSortField } from 'src/common/enums';
import { ServiceResult } from 'src/common/types';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto, GetUserListDto, UpdateUserDto } from './dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  private isValidSortField(field: UserListSortField): boolean {
    return Object.values(UserListSortField).includes(field);
  }

  async createUser(createUserDto: CreateUserDto): Promise<ServiceResult<User>> {
    try {
      // Check if email exists
      const existingEmail = await this.userRepository.findOne({
        where: { email: createUserDto.email },
      });

      if (existingEmail) {
        return {
          success: false,
          message: 'Email already exists',
          errorCode: ErrorCode.USER_ALREADY_EXISTS,
        };
      }

      // Check if name exists
      const existingName = await this.userRepository.findOne({
        where: { name: createUserDto.name },
      });

      if (existingName) {
        return {
          success: false,
          message: 'Name already exists',
          errorCode: ErrorCode.USER_ALREADY_EXISTS,
        };
      }

      const user = this.userRepository.create(createUserDto);
      const savedUser = await this.userRepository.save(user);

      return {
        success: true,
        message: 'User created successfully',
        data: savedUser,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create user',
        errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
      };
    }
  }

  async getUserList(getUserListDto: GetUserListDto): Promise<ServiceResult<{ users: User[]; total: number }>> {
    const { page, limit, sortBy, sortOrder } = getUserListDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.userRepository.createQueryBuilder('users');

    // Add sorting
    if (this.isValidSortField(sortBy)) {
      if (['createdAt', 'updatedAt'].includes(sortBy)) {
        queryBuilder
          .orderBy(`CASE WHEN users.${sortBy} IS NULL THEN 1 ELSE 0 END`, 'ASC')
          .addOrderBy(`users.${sortBy}`, sortOrder);
      } else {
        queryBuilder.orderBy(`users.${sortBy}`, sortOrder);
      }
    } else {
      queryBuilder.orderBy('users.id', 'ASC'); // Default sorting
    }

    const [users, total] = await queryBuilder.skip(skip).take(limit).getManyAndCount();

    return {
      success: true,
      message: 'Users retrieved successfully',
      data: {
        users,
        total,
      },
    };
  }

  async getUserById(id: number): Promise<ServiceResult<User>> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      return {
        success: false,
        message: 'User not found',
        errorCode: ErrorCode.USER_NOT_FOUND,
      };
    }
    return { success: true, message: 'User found', data: user };
  }

  async updateUser(id: number, updateUserDto: UpdateUserDto): Promise<ServiceResult<User>> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      return {
        success: false,
        message: 'User not found',
        errorCode: ErrorCode.USER_NOT_FOUND,
      };
    }

    // Check if new name exists (if name is being updated)
    if (updateUserDto.name && updateUserDto.name !== user.name) {
      const nameExists = await this.userRepository.findOne({
        where: { name: updateUserDto.name },
      });

      if (nameExists) {
        return {
          success: false,
          message: 'Name already exists',
          errorCode: ErrorCode.USER_ALREADY_EXISTS,
        };
      }
    }

    try {
      Object.assign(user, updateUserDto);
      user.updatedAt = new Date();

      const updatedUser = await this.userRepository.save(user);
      return {
        success: true,
        message: 'User updated successfully',
        data: updatedUser,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update user',
        errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
      };
    }
  }

  async deleteUser(id: number): Promise<ServiceResult<void>> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      return {
        success: false,
        message: 'User not found',
        errorCode: ErrorCode.USER_NOT_FOUND,
      };
    }

    try {
      await this.userRepository.remove(user);
      return {
        success: true,
        message: 'User deleted successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to delete user',
        errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
      };
    }
  }
}
