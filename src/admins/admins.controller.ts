import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpException,
  Param,
  Patch,
  Query,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { mapErrorCodeToHttpStatus } from 'src/common/utils/error-handler.util';
import { createApiResponse } from 'src/common/utils/response.util';
import { LoggerService } from 'src/logger/logger.service';
import { AdminsService } from './admins.service';
import { GetAdminListDto, UpdateAdminDto } from './dto';
import { AuthGuard } from 'src/common/guards/auth.guard';

@ApiTags('admins')
// @UseGuards(AuthGuard)
@Controller('admins')
@UsePipes(new ValidationPipe({ transform: true }))
@UseInterceptors(ClassSerializerInterceptor)
export class AdminsController {
  constructor(
    private readonly adminsService: AdminsService,
    private readonly logger: LoggerService,
  ) {}

  @Get('list')
  @ApiOperation({ summary: 'Get a list of admins with pagination, filtering, and sorting' })
  @ApiResponse({ status: 200, description: 'Returns the list of admins.' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, type: String })
  async getAdminList(@Query() getAdminListDto: GetAdminListDto) {
    const result = await this.adminsService.getAdminList(getAdminListDto);
    if (result.success) {
      return createApiResponse({
        success: true,
        message: result.message,
        data: result.data,
      });
    } else {
      throw new HttpException(
        createApiResponse({
          success: false,
          message: result.message,
          error: result.errorCode,
        }),
        mapErrorCodeToHttpStatus(result.errorCode),
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a admin by ID' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Returns the admin information.' })
  @ApiResponse({ status: 404, description: 'Admin not found.' })
  async getAdminById(@Param('id') id: number) {
    const result = await this.adminsService.getAdminById(+id);
    if (result.success) {
      return createApiResponse({
        success: true,
        message: result.message,
        data: result.data,
      });
    } else {
      throw new HttpException(
        createApiResponse({
          success: false,
          message: result.message,
          error: result.errorCode,
        }),
        mapErrorCodeToHttpStatus(result.errorCode),
      );
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a admin by admin ID' })
  @ApiBody({ type: UpdateAdminDto })
  @ApiResponse({ status: 200, description: 'The admin has been successfully updated.' })
  @ApiResponse({ status: 404, description: 'Admin not found.' })
  async updateAdmin(@Param('id') id: number, @Body() updateAdminDto: UpdateAdminDto) {
    this.logger.log('Attempting to update admin', 'AdminsController', { id, ...updateAdminDto });

    const result = await this.adminsService.updateAdmin(id, updateAdminDto);
    if (result.success) {
      this.logger.log('Successfully updated admin', 'AdminsController - updateAdmin', { id, ...result.data });
      return createApiResponse({
        success: true,
        message: result.message,
        data: result.data,
      });
    } else {
      this.logger.error('Failed to update admin', result.message, 'AdminsController - updateAdmin', {
        id,
        ...updateAdminDto,
      });
      throw new HttpException(
        createApiResponse({
          success: false,
          message: result.message,
          error: result.errorCode,
        }),
        mapErrorCodeToHttpStatus(result.errorCode),
      );
    }
  }
}
