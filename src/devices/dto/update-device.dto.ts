import { IsOptional, IsString, IsEnum, IsIP } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { FlowControlLevel } from 'src/common/enums';

export class UpdateDeviceDto {
  @ApiPropertyOptional({
    description: 'The type of the device',
    example: 'laptop',
  })
  @IsOptional()
  @IsString()
  deviceType?: string;

  @ApiPropertyOptional({
    description: 'The name of the device',
    example: 'My Laptop',
  })
  @IsOptional()
  @IsString()
  deviceName?: string;

  @ApiPropertyOptional({
    description: 'The public key of the device',
    example: 'MCowBQYDK2VwAyEASxPsG2JBYir64Cxo92ZDSBiwxrVYN2U75NpvY/v4agc=',
  })
  @IsOptional()
  @IsString()
  publicKey?: string;

  @ApiPropertyOptional({
    description: 'The flow control level of the device',
    enum: FlowControlLevel,
    example: FlowControlLevel.MEDIUM,
  })
  @IsOptional()
  @IsEnum(FlowControlLevel)
  flowControlLevel?: FlowControlLevel;

  @ApiPropertyOptional({
    description: 'The IP address of the device',
    example: '192.168.1.100',
  })
  @IsOptional()
  @IsIP()
  ipAddr?: string;

  @ApiPropertyOptional({
    description: 'The host of the device',
    example: 'DESKTOP-123A',
  })
  @IsOptional()
  @IsString()
  host?: string;

  @ApiPropertyOptional({
    description: 'The login user of the device',
    example: 'user1',
  })
  @IsOptional()
  @IsString()
  loginUser?: string;
}
