import { IsEnum, IsString, IsObject, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventLevel, EventTag, EventType } from 'src/common/enums';
import { EventContext } from '../types/event-context.interface';

export class CreateEventDto {
  @ApiProperty({
    enum: EventLevel,
    description: 'Event severity level',
    example: EventLevel.INFO,
  })
  @IsEnum(EventLevel)
  level: EventLevel;

  @ApiProperty({
    enum: EventType,
    description: 'Type of the event',
    example: EventType.DEVICE_REGISTRATION,
  })
  @IsEnum(EventType)
  type: EventType;

  @ApiProperty({
    enum: EventTag,
    description: 'Tag of the event',
    example: EventTag.DEVICE,
  })
  @IsEnum(EventTag)
  tag: EventTag;

  @ApiProperty({
    description: 'Brief description of the event',
    example: 'Device connected.',
  })
  @IsString()
  message: string;

  @ApiPropertyOptional({
    description: 'Detailed information about the event',
    example: 'Device 1 successfully connected on 192.168.1.100',
  })
  @IsString()
  @IsOptional()
  details?: string;

  @ApiPropertyOptional({
    description: 'Additional context information for the event',
    example: {
      deviceId: 'device-1',
      deviceName: 'Device 1',
      ipAddress: '192.168.1.100',
    },
  })
  @IsObject()
  @IsOptional()
  context?: EventContext;
}
