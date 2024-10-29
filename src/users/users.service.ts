import { Injectable } from '@nestjs/common';
import { User } from 'src/entities';
import { ErrorCode, UserListSortField } from 'src/common/enums';
import { ServiceResult } from 'src/common/types';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { GetUserListDto, UpdateUserDto } from './dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  private isValidSortField(field: UserListSortField): boolean {
    return Object.values(UserListSortField).includes(field);
  }

  async getUserList(getUserListDto: GetUserListDto): Promise<ServiceResult<{ users: User[]; total: number }>> {
    const { page, limit, sortBy, sortOrder } = getUserListDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.userRepository.createQueryBuilder('user');

    // Add sorting
    if (this.isValidSortField(sortBy)) {
      if (['createdAt', 'updatedAt'].includes(sortBy)) {
        queryBuilder
          .orderBy(`CASE WHEN user.${sortBy} IS NULL THEN 1 ELSE 0 END`, 'ASC')
          .addOrderBy(`user.${sortBy}`, sortOrder);
      } else {
        queryBuilder.orderBy(`user.${sortBy}`, sortOrder);
      }
    } else {
      queryBuilder.orderBy('user.id', 'ASC'); // Default sorting
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

    Object.assign(user, updateUserDto);
    user.updatedAt = new Date();

    try {
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
}
