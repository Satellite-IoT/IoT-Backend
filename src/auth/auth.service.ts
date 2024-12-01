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
    const { email, password } = signinAuthDto;
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id.toString(), role: 'user' };
    const access_token = await this.jwtService.signAsync(payload);

    res.cookie('iot_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // 僅在生產環境中啟用 secure 標誌
      maxAge: 1000 * 60 * 60 * 24,
      sameSite: 'strict',
      // domain:'localhost'
    });

    res.cookie('is_login', 'true', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production', // 僅在生產環境中啟用 secure 標誌
      maxAge: 1000 * 60 * 60 * 24,
      sameSite: 'strict',
      // domain:'localhost'
    });

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async signup(signupAuthDto: AuthSignUpDto) {
    const { email, password } = signupAuthDto;

    const isExisted = await this.userRepository.exists({ where: { email } });
    if (isExisted) {
      throw new BadRequestException('Email already exists');
    }

    try {
      const user = this.userRepository.create({
        email,
        password,
        role: AccountRole.USER,
      });

      await this.userRepository.save(user);

      return { msg: 'success' };
    } catch (error) {
      throw new BadRequestException('Failed to create user');
    }
  }

  async signout(res: Response) {
    try {
      res.cookie('is_login', '', {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        expires: new Date(1),
        sameSite: 'strict',
      });

      res.cookie('iot_token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        expires: new Date(1),
        sameSite: 'strict',
      });

      return { msg: 'success' };
    } catch (error) {
      throw new BadRequestException('Failed to sign out');
    }
  }
}
