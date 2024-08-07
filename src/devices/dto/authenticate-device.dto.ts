import { IsString, IsNotEmpty } from 'class-validator';

export class AuthenticateDeviceDto {
  @IsString()
  @IsNotEmpty()
  signature: string;

  @IsString()
  @IsNotEmpty()
  deviceType: string;

  @IsString()
  @IsNotEmpty()
  deviceId: string;
}
