import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthSignInDto, AuthSignUpDto } from './dto/index';
import { User } from 'src/entities';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { AccountRole } from 'src/common/enums';
import { Request, Response } from 'express';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}
  async signin(signinAuthDto: AuthSignInDto, res: Response) {
    const email = signinAuthDto.email;
    const password = signinAuthDto.password;
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new UnauthorizedException();
    }
    if (user?.password !== password) {
      throw new UnauthorizedException();
    }

    const payload = { sub: user.id.toString(), role: 'user' };

    const access_token = await this.jwtService.signAsync(payload);

    res.cookie('iot_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // 僅在生產環境中啟用 secure 標誌
      maxAge: 1000 * 60 * 60 * 24 * 7,
      sameSite: 'strict',
      // domain:'localhost'
    });
    res.cookie('is_login', 'true', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production', // 僅在生產環境中啟用 secure 標誌
      maxAge: 1000 * 60 * 60 * 24 * 7,
      sameSite: 'strict',
      // domain:'localhost'
    });

    return {
      access_token: access_token,
    };
  }

  async signup(signupAuthDto: AuthSignUpDto) {
    const email = signupAuthDto.email;
    const password = signupAuthDto.password;

    const isExisted = await this.userRepository.exists({ where: { email } });
    if (isExisted) {
      throw new BadRequestException();
    }

    try {
      const user = this.userRepository.create({
        email,
        password,
        role: AccountRole.USER,
      });

      await this.userRepository.save(user);
    } catch {
      throw new BadRequestException();
    }

    return { msg: 'success' };
  }

  signout(res: Response) {
    res.cookie('is_login', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // 僅在生產環境中啟用 secure 標誌
      expires: new Date(1),
      sameSite: 'strict',
      // domain:'localhost'
    });
    res.cookie('iot_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // 僅在生產環境中啟用 secure 標誌
      expires: new Date(1),
      sameSite: 'strict',
      // domain:'localhost'
    });

    return { msg: 'success' };
  }
}
