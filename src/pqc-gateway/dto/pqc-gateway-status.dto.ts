import { IsString, IsArray, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class NetworkInfoItemDto {
  @ApiProperty({
    description: 'Network interface name (e.g., WAN1, WAN2)',
    example: 'WAN1',
  })
  @IsString()
  @IsNotEmpty()
  Interface: string;

  @ApiProperty({
    description: 'Network type (e.g., ETHERNET, SATELLITE, MOBILE)',
    example: 'ETHERNET',
  })
  @IsString()
  @IsNotEmpty()
  host: string;

  @ApiProperty({
    description: 'IP address of the interface',
    example: '192.168.1.99',
  })
  @IsString()
  @IsNotEmpty()
  ipAddr: string;
}

class NetworkInfoDto {
  @ApiProperty({
    description: 'Primary network route type',
    example: 'ETHERNET',
  })
  @IsString()
  @IsNotEmpty()
  networkRoute: string;

  @ApiProperty({
    description: 'Current upload traffic rate',
    example: '0.68 kbit/s',
  })
  @IsString()
  @IsNotEmpty()
  uploadTraffic: string;

  @ApiProperty({
    description: 'Current download traffic rate',
    example: '13.83 kbit/s',
  })
  @IsString()
  @IsNotEmpty()
  downloadTraffic: string;

  @ApiProperty({
    description: 'Detailed information about network interfaces',
    type: [NetworkInfoItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NetworkInfoItemDto)
  networkInfo: NetworkInfoItemDto[];
}

class DeviceInfoDto {
  @ApiProperty({
    description: 'Type of the connected device',
    example: 'laptop',
  })
  @IsString()
  deviceType: string;

  @ApiProperty({
    description: 'Unique identifier of the connected device',
    example: 'device-1',
  })
  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @ApiProperty({
    description: 'Username of the logged-in user on the device',
    example: 'user1',
  })
  @IsString()
  loginUser: string;

  @ApiProperty({
    description: 'Hostname of the connected device',
    example: 'worker-P45V',
  })
  @IsString()
  @IsNotEmpty()
  host: string;

  @ApiProperty({
    description: 'IP address of the connected device',
    example: '192.168.10.142',
  })
  @IsString()
  @IsNotEmpty()
  ipAddr: string;
}

export class PqcGatewayStatusDto {
  @ApiProperty({
    description: 'Digital signature for verifying the authenticity of the data',
    example: 'fi4VePZcGiFQZM1oXREmm3oZRFVD6dRsQPbRMKvl5h/pVLEuuCNdmjha0+3/tjiu9m3M9apYo3ZtXV7iGwZjCw==',
  })
  @IsString()
  @IsNotEmpty()
  signature: string;

  @ApiProperty({
    description: 'Unique identifier of the PQC gateway device',
    example: 'pqc-gateway-1',
  })
  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @ApiProperty({
    description: 'Name of the PQC gateway device',
    example: 'PQC Gateway 1',
  })
  @IsString()
  @IsNotEmpty()
  deviceName: string;

  @ApiProperty({
    description: 'Comprehensive network information',
    type: NetworkInfoDto,
  })
  @ValidateNested()
  @Type(() => NetworkInfoDto)
  networkInfo: NetworkInfoDto;

  @ApiProperty({
    description: 'Information about devices connected to the PQC gateway',
    type: [DeviceInfoDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeviceInfoDto)
  deviceInfo: DeviceInfoDto[];
}
