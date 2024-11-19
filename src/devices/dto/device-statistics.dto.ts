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

  @ApiProperty({ description: 'Distribution of device connection status' })
  connectionStatusDistribution: {
    connected: number;
    disconnected: number;
    unknown: number;
  };

  @ApiProperty({ description: 'Distribution of device types' })
  deviceTypeDistribution: Record<string, number>;

  @ApiProperty({ description: 'Distribution of flow control levels' })
  flowControlDistribution: {
    high: number;
    medium: number;
    low: number;
  };

  @ApiProperty({ description: 'Time-related statistics' })
  timeStats: {
    devicesByAgeGroups: {
      lessThan1Days: number;
      lessThan7Days: number;
      lessThan30Days: number;
      moreThan30Days: number;
    };
  };
}
