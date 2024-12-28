import { IsOptional, IsInt, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SortOrder, AdminListSortField } from 'src/common/enums';

export class GetAdminListDto {
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
  @IsEnum(AdminListSortField)
  @ApiPropertyOptional({
    enum: AdminListSortField,
    description: 'Field to sort by',
    default: AdminListSortField.ID,
  })
  sortBy?: AdminListSortField = AdminListSortField.ID;

  @IsOptional()
  @IsEnum(SortOrder)
  @ApiPropertyOptional({ description: 'Sort order (ASC or DESC)', enum: SortOrder, default: SortOrder.ASC })
  sortOrder?: SortOrder = SortOrder.ASC;
}
