import { IsString, IsNotEmpty, IsIP, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AuthenticateDeviceDto {
  @ApiProperty({
    description: 'The signature for device authentication',
    example: 'fqj70CMoVeWGXWIFJ+AOsGbh5O8lfe9xQEXt8lSqVnwW8ShX/gx5G8yBCYw680SEIeQzqp8HvFh9lqzfxjYrDA==',
  })
  @IsString()
  @IsNotEmpty()
  signature: string;

  @ApiProperty({
    description: 'The type of the device',
    example: 'laptop',
  })
  @IsString()
  @IsNotEmpty()
  deviceType: string;

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
}
