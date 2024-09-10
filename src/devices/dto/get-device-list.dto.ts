import { IsOptional, IsInt, Min, IsString, IsBoolean, IsEnum, IsObject, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SortField, SortOrder } from 'src/common/enums';

export class GetDeviceListDto {
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
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @ApiPropertyOptional({ description: 'Include pqc-gateway devices', default: false })
  includePqcGateway?: boolean = false;

  @IsOptional()
  @IsEnum(SortField)
  @ApiPropertyOptional({
    enum: SortField,
    description: 'Field to sort by',
    default: SortField.ID,
  })
  sortBy?: SortField = SortField.ID;

  @IsOptional()
  @IsEnum(SortOrder)
  @ApiPropertyOptional({ description: 'Sort order (ASC or DESC)', enum: SortOrder, default: SortOrder.ASC })
  sortOrder?: SortOrder = SortOrder.ASC;
}
