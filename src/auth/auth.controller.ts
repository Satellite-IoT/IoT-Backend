import { Controller, Req, Get, Post, Body, Patch, Param, Delete, UseGuards, Res, UseInterceptors, Header } from '@nestjs/common';

import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AuthSignInDto, AuthSignUpDto } from './dto/index';
import { ApiTags } from '@nestjs/swagger';
import { PrivateDataInterceptor } from 'src/common/interceptors/private-data.interceptor';
// import { UpdateAuthDto } from './dto/signup-auth.dto';
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

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
  signout(@Res({ passthrough: true }) res: Response) {
    return this.signout(res);
    
  }


  @Post('test')
  @Header('Content-Type', 'application/json')
  @UseInterceptors(PrivateDataInterceptor)
  test(@Req() req: Request) {

    console.log(req.privateData);

    return {msg:"success"};

  }
}
