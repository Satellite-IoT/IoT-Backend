import { IsString, IsArray, ValidateNested, IsNotEmpty, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { EventLevel } from 'src/common/enums';

class AlarmInfoDto {
  @ApiProperty({
    description: 'Severity level of the alarm',
    example: EventLevel.WARNING,
    enum: EventLevel,
  })
  @IsEnum(EventLevel)
  alarmType: EventLevel;

  @ApiProperty({
    description: 'Detailed description of the alarm',
    example: 'Detailed description of the alarm',
  })
  @IsString()
  @IsNotEmpty()
  alarmDestription: string;
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
