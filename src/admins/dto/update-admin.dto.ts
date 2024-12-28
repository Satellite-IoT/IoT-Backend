import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { FlowControlLevel } from 'src/common/enums';

export class UpdateAdminDto {
  @ApiPropertyOptional({
    description: 'The name of the admin',
    example: 'Admin',
  })
  @IsOptional()
  @IsString()
  name?: string;
}
