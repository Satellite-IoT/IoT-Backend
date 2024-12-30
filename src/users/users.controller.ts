import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpException,
  Param,
  Patch,
  Post,
  Delete,
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
import { UsersService } from './users.service';
import { CreateUserDto, GetUserListDto, UpdateUserDto } from './dto';
import { AuthGuard } from 'src/common/guards/auth.guard';

@ApiTags('users')
// @UseGuards(AuthGuard)
@Controller('users')
@UsePipes(new ValidationPipe({ transform: true }))
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly logger: LoggerService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'The user has been successfully created.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async createUser(@Body() createUserDto: CreateUserDto) {
    this.logger.log('Attempting to create user', 'UsersController', createUserDto);

    const result = await this.usersService.createUser(createUserDto);
    if (result.success) {
      this.logger.log('User created successfully', 'UsersController - createUser', result.data);
      return createApiResponse({
        success: true,
        message: result.message,
        data: result.data,
      });
    } else {
      this.logger.error('Failed to create user', result.message, 'UsersController - createUser', createUserDto);
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

  @Get('list')
  @ApiOperation({ summary: 'Get a list of users with pagination and sorting' })
  @ApiResponse({ status: 200, description: 'Returns the list of users.' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, type: String })
  async getUserList(@Query() getUserListDto: GetUserListDto) {
    const result = await this.usersService.getUserList(getUserListDto);
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
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Returns the user information.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async getUserById(@Param('id') id: number) {
    const result = await this.usersService.getUserById(+id);
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
  @ApiOperation({ summary: 'Update a user by ID' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'The user has been successfully updated.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async updateUser(@Param('id') id: number, @Body() updateUserDto: UpdateUserDto) {
    this.logger.log('Attempting to update user', 'UsersController', { id, ...updateUserDto });

    const result = await this.usersService.updateUser(id, updateUserDto);
    if (result.success) {
      this.logger.log('Successfully updated user', 'UsersController - updateUser', { id, ...result.data });
      return createApiResponse({
        success: true,
        message: result.message,
        data: result.data,
      });
    } else {
      this.logger.error('Failed to update user', result.message, 'UsersController - updateUser', {
        id,
        ...updateUserDto,
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

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user by ID' })
  @ApiResponse({ status: 200, description: 'The user has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async deleteUser(@Param('id') id: number) {
    this.logger.log('Attempting to delete user', 'UsersController', { id });

    const result = await this.usersService.deleteUser(id);
    if (result.success) {
      this.logger.log('Successfully deleted user', 'UsersController - deleteUser', { id });
      return createApiResponse({
        success: true,
        message: result.message,
      });
    } else {
      this.logger.error('Failed to delete user', result.message, 'UsersController - deleteUser', { id });
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
