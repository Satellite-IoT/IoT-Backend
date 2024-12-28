import { IsOptional, IsString, IsEnum, Length } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { FlowControlLevel } from 'src/common/enums';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'Name of the user',
    example: 'Brian',
  })
  @IsOptional()
  @IsString()
  @Length(2, 50)
  name?: string;

  @ApiPropertyOptional({
    description: 'Flow control level of the user',
    enum: FlowControlLevel,
    example: FlowControlLevel.LOW,
  })
  @IsOptional()
  @IsEnum(FlowControlLevel)
  flowControlLevel?: FlowControlLevel;
}
