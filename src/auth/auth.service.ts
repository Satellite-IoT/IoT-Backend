import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthSignInDto, AuthSignUpDto } from './dto/index';
import { Admin } from 'src/entities';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { AccountRole } from 'src/common/enums';
import { Response } from 'express';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
    private jwtService: JwtService,
  ) {}

  async signin(signinAuthDto: AuthSignInDto, res: Response) {
    const { email, password } = signinAuthDto;
    const admin = await this.adminRepository.findOne({ where: { email } });

    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await admin.validatePassword(password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: admin.id.toString(), role: 'admin' };
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
        id: admin.id,
        email: admin.email,
        name: admin.name,
      },
    };
  }

  async signup(signupAuthDto: AuthSignUpDto) {
    const { email, password } = signupAuthDto;

    const isExisted = await this.adminRepository.exists({ where: { email } });
    if (isExisted) {
      throw new BadRequestException('Email already exists');
    }

    try {
      const admin = this.adminRepository.create({
        email,
        password,
      });

      await this.adminRepository.save(admin);

      return { msg: 'success' };
    } catch (error) {
      throw new BadRequestException('Failed to create admin');
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
