import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { Event } from 'src/entities';
import { EventLevel, EventType } from 'src/common/enums';

export class DeviceCtrlDto {
  @ApiProperty({
    description: 'IP address of the device',
    example: '192.168.10.142',
  })
  @IsString()
  ipAddr: string;

  @ApiProperty({
    description: 'Bandwidth level of the device',
    example: 'medium',
    enum: ['low', 'medium', 'high'],
  })
  bandwidth: 'low' | 'medium' | 'high';
}

export class EventDto {
  @ApiProperty({
    enum: EventLevel,
    description: 'Event severity level',
    example: EventLevel.WARNING,
  })
  @IsEnum(EventLevel)
  level: EventLevel;

  @ApiProperty({
    description: 'Brief description of the event',
    example: 'Device connected.',
  })
  @IsString()
  message: string;
}

export class PqcGatewayStatusResponseDto {
  @ApiProperty({
    description: 'Result of the operation',
    example: 'success',
  })
  result: 'success';

  @ApiProperty({
    description: 'Array of device control information',
    type: [DeviceCtrlDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeviceCtrlDto)
  deviceCtrl: DeviceCtrlDto[];
}

export class PqcGatewayAlarmResponseDto {
  @ApiProperty({
    description: 'Result of the operation',
    example: 'success',
  })
  result: 'success';

  @ApiProperty({
    description: 'Success message',
    example: 'Alarm received successfully',
  })
  @IsString()
  message: string;

  @ApiProperty({
    description: 'Array of updated events',
    type: [EventDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventDto)
  updatedEvents: EventDto[];
}

export class PqcGatewayErrorResponseDto {
  @ApiProperty({
    description: 'Result of the operation',
    example: 'error',
  })
  result: 'error';

  @ApiProperty({
    description: 'Error message',
    example: 'An error occurred',
  })
  @IsString()
  message: string;

  @ApiProperty({
    description: 'Error code',
    example: 'SOME_ERROR',
  })
  @IsString()
  error: string;
}

export class PqcGatewayNotFoundErrorDto extends PqcGatewayErrorResponseDto {
  @ApiProperty({
    description: 'Result of the operation',
    example: 'error',
  })
  result: 'error';

  @ApiProperty({
    description: 'Error message',
    example: 'PQC Gateway not registered',
  })
  message: string;

  @ApiProperty({
    description: 'Error code',
    example: 'DEVICE_NOT_FOUND',
  })
  error: 'DEVICE_NOT_FOUND';
}

export class PqcGatewayAuthenticationErrorDto extends PqcGatewayErrorResponseDto {
  @ApiProperty({
    description: 'Result of the operation',
    example: 'error',
  })
  result: 'error';

  @ApiProperty({
    description: 'Error message',
    example: 'PQC Gateway not connected or not authenticated',
  })
  message: string;

  @ApiProperty({
    description: 'Error code',
    example: 'AUTHENTICATION_FAILED',
  })
  error: 'AUTHENTICATION_FAILED';
}

export type PqcGatewayResponseDto =
  | PqcGatewayStatusResponseDto
  | PqcGatewayAlarmResponseDto
  | PqcGatewayErrorResponseDto
  | PqcGatewayNotFoundErrorDto
  | PqcGatewayAuthenticationErrorDto;
