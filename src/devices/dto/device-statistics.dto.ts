import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';

export class DeviceStatisticsResponseDto {
  @ApiProperty({ description: 'Total number of devices' })
  totalDevices: number;

  @ApiProperty({ description: 'Number of registered devices' })
  registeredDevices: number;

  @ApiProperty({ description: 'Number of authenticated devices' })
  authenticatedDevices: number;

  @ApiProperty({ description: 'Number of recently added devices' })
  recentlyAddedDevices: number;
}
