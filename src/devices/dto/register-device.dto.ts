import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
}
