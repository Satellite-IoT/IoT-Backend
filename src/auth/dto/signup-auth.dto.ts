import { IsEmail, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AuthSignUpDto {
  @IsNotEmpty({ message: 'email cannot be empty' })
  @Length(6, 30, { message: 'Email must be between 6 and 30 characters long' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @ApiProperty()
  email: string;

  @IsNotEmpty()
  @Length(8, 30)
  @ApiProperty()
  password: string;
}
