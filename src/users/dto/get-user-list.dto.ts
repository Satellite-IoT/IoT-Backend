import { IsOptional, IsInt, Min, IsString, IsBoolean, IsEnum, IsObject, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SortOrder, UserListSortField } from 'src/common/enums';

export class GetUserListDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @ApiPropertyOptional({ description: 'Number of items per page', default: 10 })
  limit?: number = 10;

  @IsOptional()
  @IsEnum(UserListSortField)
  @ApiPropertyOptional({
    enum: UserListSortField,
    description: 'Field to sort by',
    default: UserListSortField.ID,
  })
  sortBy?: UserListSortField = UserListSortField.ID;

  @IsOptional()
  @IsEnum(SortOrder)
  @ApiPropertyOptional({ description: 'Sort order (ASC or DESC)', enum: SortOrder, default: SortOrder.ASC })
  sortOrder?: SortOrder = SortOrder.ASC;
}
