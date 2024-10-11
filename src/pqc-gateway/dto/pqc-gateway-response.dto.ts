import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, ValidateNested, IsEnum, IsDate } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Event } from 'src/entities';
import { AlarmType } from 'src/common/enums';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { parseISO } from 'date-fns';

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

export class AlarmDto {
  @ApiProperty({
    enum: AlarmType,
    description: 'Alarm severity level',
    example: AlarmType.WARNING,
  })
  @IsEnum(AlarmType)
  alarmType: AlarmType;

  @ApiProperty({
    description: 'Brief description of the alarm',
    example: 'Device connected.',
  })
  @IsString()
  alarmDescription: string;

  @ApiProperty({
    description: 'ID of the device that triggered the alarm',
    example: 'pqc-gateway-1',
  })
  @IsString()
  deviceId: string;

  @ApiProperty({
    description: 'Name of the device that triggered the alarm',
    example: 'PQC Gateway 1',
  })
  @IsString()
  deviceName: string;

  @ApiProperty({
    description: 'Timestamp when the alarm was created (in Asia/Taipei timezone)',
    example: '2023-09-23T20:34:56+08:00',
  })
  @IsString()
  createdAt: string;
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
    description: 'Array of updated alarms',
    type: [AlarmDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AlarmDto)
  updatedAlarms: AlarmDto[];
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
