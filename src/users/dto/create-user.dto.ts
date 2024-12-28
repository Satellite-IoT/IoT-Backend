import { IsEmail, IsNotEmpty, IsString, IsEnum, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { FlowControlLevel } from 'src/common/enums';

export class CreateUserDto {
  @ApiProperty({
    description: 'Email of the user',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty()
  @Length(6, 30)
  email: string;

  @ApiProperty({
    description: 'Password of the user',
    example: 'password123',
  })
  @IsString()
  @IsNotEmpty()
  @Length(8, 30)
  password: string;

  @ApiProperty({
    description: 'Name of the user',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  name: string;

  @ApiProperty({
    description: 'Flow control level of the user',
    enum: FlowControlLevel,
    example: FlowControlLevel.LOW,
    default: FlowControlLevel.LOW,
  })
  @IsEnum(FlowControlLevel)
  @IsNotEmpty()
  flowControlLevel: FlowControlLevel = FlowControlLevel.LOW;
}
