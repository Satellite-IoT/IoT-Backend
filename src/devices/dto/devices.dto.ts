import { IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class GetDeviceParamDto {
  @IsNumber()
  @Type(() => Number)
  id: number;
}
