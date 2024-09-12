import { IsString, IsNotEmpty, IsIP, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { FlowControlLevel } from 'src/common/enums';

export class RegisterDeviceDto {
  @ApiProperty({
    description: 'The public key of the device',
    example: 'MCowBQYDK2VwAyEASxPsG2JBYir64Cxo92ZDSBiwxrVYN2U75NpvY/v4agc=',
  })
  @IsString()
  @IsNotEmpty()
  publicKey: string;

  @ApiProperty({
    description: 'The unique identifier of the device',
    example: 'device-1',
  })
  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @ApiProperty({
    description: 'The IP address of the device',
    example: '192.168.1.100',
    required: false,
  })
  @IsOptional()
  @IsIP()
  ipAddr?: string;

  @ApiProperty({
    description: 'The name of the device',
    example: 'Device Name',
    required: false,
  })
  @IsOptional()
  @IsString()
  deviceName?: string;

  @ApiProperty({
    description: 'The flow control level of the device',
    enum: FlowControlLevel,
    example: FlowControlLevel.MEDIUM,
    required: false,
  })
  @IsOptional()
  @IsEnum(FlowControlLevel)
  flowControlLevel?: FlowControlLevel;
}
