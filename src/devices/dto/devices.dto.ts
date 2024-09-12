import { IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class GetDeviceParamDto {
  @ApiProperty({
    description: 'The ID of the device',
    example: 1,
  })
  @IsNumber()
  @Type(() => Number)
  id: number;
}
