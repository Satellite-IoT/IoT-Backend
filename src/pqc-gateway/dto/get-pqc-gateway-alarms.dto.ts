import { IsOptional, IsInt, Min, IsEnum, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AlarmType, AlarmStatus, SortOrder } from 'src/common/enums';

export class GetPqcGatewayAlarmsDto {
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
  @IsEnum(AlarmType)
  @ApiPropertyOptional({
    enum: AlarmType,
    description: 'Type of alarm to filter',
  })
  alarmType?: AlarmType;

  @IsOptional()
  @IsEnum(AlarmStatus)
  @ApiPropertyOptional({
    enum: AlarmStatus,
    description: 'Status of alarm to filter',
  })
  alarmStatus?: AlarmStatus;

  @IsOptional()
  @IsEnum(['id', 'alarmType', 'alarmStatus', 'createdAt'])
  @ApiPropertyOptional({
    enum: ['id', 'alarmType', 'alarmStatus', 'createdAt'],
    description: 'Field to sort by',
    default: 'createdAt',
  })
  sortBy?: 'id' | 'alarmType' | 'alarmStatus' | 'createdAt' = 'createdAt';

  @IsOptional()
  @IsEnum(SortOrder)
  @ApiPropertyOptional({
    enum: SortOrder,
    description: 'Sort order (ASC or DESC)',
    default: SortOrder.DESC,
  })
  sortOrder?: SortOrder = SortOrder.DESC;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @ApiPropertyOptional({ description: 'Start date for filtering alarms' })
  startDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @ApiPropertyOptional({ description: 'End date for filtering alarms' })
  endDate?: Date;
}
