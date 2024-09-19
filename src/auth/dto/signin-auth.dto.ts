import { IsEmail, IsNotEmpty, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AuthSignInDto {
  @IsEmail()
  @Length(6, 30)
  @ApiProperty()
  email: string;

  @Length(8, 30)
  @ApiProperty()
  password: string;
}
