import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { FlowControlLevel } from 'src/common/enums';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'The name of the user',
    example: 'Brian',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'The username of the User',
    example: 'brian123',
  })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({
    description: 'The flow control level of the user',
    enum: FlowControlLevel,
    example: FlowControlLevel.MEDIUM,
  })
  @IsOptional()
  @IsEnum(FlowControlLevel)
  flowControlLevel?: FlowControlLevel;
}
