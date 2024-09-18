import { IsEmail, IsNotEmpty,Length,Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AuthSignUpDto {
    @IsNotEmpty({ message: 'email cannot be empty' })
    @Length(6, 30, { message: 'Username must be between 6 and 30 characters long' })
    @Matches(/^(?=.{6,30}$)(?!\.)(?!.*\.\.)[a-zA-Z0-9.]+(?<!\.)@[^\s@]+\.[^\s@]+$/, 
    { message: 'Username must only contain letters, numbers, and allowed special characters. It cannot start or end with a period (.) and must not contain consecutive periods (..)' })
    @IsEmail({}, { message: 'Username must be a valid email address' })
    @ApiProperty()
    email: string;

    @IsNotEmpty()
    @Length(8, 30)
    @ApiProperty()
    password: string;




}
