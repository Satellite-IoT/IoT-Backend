import { Injectable } from '@nestjs/common';
import { Admin } from 'src/entities';
import { ErrorCode, AdminListSortField } from 'src/common/enums';
import { ServiceResult } from 'src/common/types';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { GetAdminListDto, UpdateAdminDto } from './dto';

@Injectable()
export class AdminsService {
  constructor(
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
  ) {}

  private isValidSortField(field: AdminListSortField): boolean {
    return Object.values(AdminListSortField).includes(field);
  }

  async getAdminList(getAdminListDto: GetAdminListDto): Promise<ServiceResult<{ admins: Admin[]; total: number }>> {
    const { page, limit, sortBy, sortOrder } = getAdminListDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.adminRepository.createQueryBuilder('admins');

    // Add sorting
    if (this.isValidSortField(sortBy)) {
      if (['createdAt', 'updatedAt'].includes(sortBy)) {
        queryBuilder
          .orderBy(`CASE WHEN admins.${sortBy} IS NULL THEN 1 ELSE 0 END`, 'ASC')
          .addOrderBy(`admins.${sortBy}`, sortOrder);
      } else {
        queryBuilder.orderBy(`admins.${sortBy}`, sortOrder);
      }
    } else {
      queryBuilder.orderBy('admins.id', 'ASC'); // Default sorting
    }

    const [admins, total] = await queryBuilder.skip(skip).take(limit).getManyAndCount();

    return {
      success: true,
      message: 'Admins retrieved successfully',
      data: {
        admins,
        total,
      },
    };
  }

  async getAdminById(id: number): Promise<ServiceResult<Admin>> {
    const admin = await this.adminRepository.findOne({ where: { id } });
    if (!admin) {
      return {
        success: false,
        message: 'Admin not found',
        errorCode: ErrorCode.ADMIN_NOT_FOUND,
      };
    }
    return { success: true, message: 'Admin found', data: admin };
  }

  async updateAdmin(id: number, updateAdminDto: UpdateAdminDto): Promise<ServiceResult<Admin>> {
    const exists = await this.adminRepository.exist({ where: { id } });

    if (!exists) {
      return {
        success: false,
        message: 'Admin not found',
        errorCode: ErrorCode.ADMIN_NOT_FOUND,
      };
    }

    const allowedFields = ['name'];

    const filteredData = Object.keys(updateAdminDto)
      .filter((key) => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updateAdminDto[key];
        return obj;
      }, {} as Partial<Admin>);

    filteredData.updatedAt = new Date();

    try {
      await this.adminRepository.update(id, filteredData);
      const updatedAdmin = await this.adminRepository.findOne({ where: { id } });

      return {
        success: true,
        message: 'Admin updated successfully',
        data: updatedAdmin,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update admin',
        errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
      };
    }
  }
}
