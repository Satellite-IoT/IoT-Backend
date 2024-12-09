import { Controller, Post, Body, Res, Header } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { AuthSignInDto, AuthSignUpDto } from './dto/index';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signin')
  @Header('Content-Type', 'application/json')
  async signin(@Body() signinDto: AuthSignInDto, @Res({ passthrough: true }) @Res() res: Response) {
    return await this.authService.signin(signinDto, res);
  }

  @Post('signup')
  @Header('Content-Type', 'application/json')
  async signup(@Body() signupDto: AuthSignUpDto) {
    return await this.authService.signup(signupDto);
  }

  @Post('signout')
  @Header('Content-Type', 'application/json')
  async signout(@Res({ passthrough: true }) res: Response) {
    return await this.authService.signout(res);
  }
}
