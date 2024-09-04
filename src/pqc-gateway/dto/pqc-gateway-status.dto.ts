import { IsString, IsArray, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

class NetworkInfoItemDto {
  @IsString()
  @IsNotEmpty()
  Interface: string;

  @IsString()
  @IsNotEmpty()
  host: string;

  @IsString()
  @IsNotEmpty()
  ipAddr: string;
}

class NetworkInfoDto {
  @IsString()
  @IsNotEmpty()
  networkRoute: string;

  @IsString()
  @IsNotEmpty()
  uploadTraffic: string;

  @IsString()
  @IsNotEmpty()
  downloadTraffic: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NetworkInfoItemDto)
  networkInfo: NetworkInfoItemDto[];
}

class DeviceInfoDto {
  @IsString()
  deviceType: string;

  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @IsString()
  loginUser: string;

  @IsString()
  @IsNotEmpty()
  host: string;

  @IsString()
  @IsNotEmpty()
  ipAddr: string;
}

export class PqcGatewayStatusDto {
  @IsString()
  @IsNotEmpty()
  signature: string;

  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @IsString()
  @IsNotEmpty()
  deviceName: string;

  @ValidateNested()
  @Type(() => NetworkInfoDto)
  networkInfo: NetworkInfoDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeviceInfoDto)
  deviceInfo: DeviceInfoDto[];
}
