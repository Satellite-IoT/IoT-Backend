import { IsString, IsArray, ValidateNested, IsNotEmpty, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { AlarmType } from 'src/common/enums';

export class AlarmInfoDto {
  @ApiProperty({
    description: 'Severity level of the alarm',
    example: AlarmType.WARNING,
    enum: AlarmType,
  })
  @IsEnum(AlarmType)
  alarmType: AlarmType;

  @ApiProperty({
    description: 'Detailed description of the alarm',
    example: 'Detailed description of the alarm',
  })
  @IsString()
  @IsNotEmpty()
  alarmDescription: string;
}

export class PqcGatewayAlarmDto {
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
    description: 'Array of alarm information objects',
    type: [AlarmInfoDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AlarmInfoDto)
  alarmInfo: AlarmInfoDto[];
}
