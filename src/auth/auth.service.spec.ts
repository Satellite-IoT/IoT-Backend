import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from 'src/entities';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import { AccountRole } from 'src/common/enums';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let jwtService: JwtService;

  const mockUserRepository = {
    findOne: jest.fn(),
    exists: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  const cookieMock = jest.fn().mockReturnThis();
  const mockResponse = {
    cookie: cookieMock,
  } as unknown as Response;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signin', () => {
    const mockSigninDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    const mockUser = {
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
      role: AccountRole.USER,
      validatePassword: jest.fn(),
    };

    it('should successfully sign in a user', async () => {
      mockUser.validatePassword.mockResolvedValue(true);
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockJwtService.signAsync.mockResolvedValue('mock_token');

      const result = await service.signin(mockSigninDto, mockResponse);

      expect(result).toEqual({
        access_token: 'mock_token',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          role: mockUser.role,
        },
      });
      expect(cookieMock).toHaveBeenCalledTimes(2);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.signin(mockSigninDto, mockResponse)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      mockUser.validatePassword.mockResolvedValue(false);
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.signin(mockSigninDto, mockResponse)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('signup', () => {
    const mockSignupDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should successfully create a new user', async () => {
      mockUserRepository.exists.mockResolvedValue(false);
      mockUserRepository.create.mockReturnValue(mockSignupDto);
      mockUserRepository.save.mockResolvedValue(mockSignupDto);

      const result = await service.signup(mockSignupDto);

      expect(result).toEqual({ msg: 'success' });
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        ...mockSignupDto,
        role: AccountRole.USER,
      });
    });

    it('should throw BadRequestException when email already exists', async () => {
      mockUserRepository.exists.mockResolvedValue(true);

      await expect(service.signup(mockSignupDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when save fails', async () => {
      mockUserRepository.exists.mockResolvedValue(false);
      mockUserRepository.save.mockRejectedValue(new Error());

      await expect(service.signup(mockSignupDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('signout', () => {
    it('should successfully sign out a user', async () => {
      const result = await service.signout(mockResponse);

      expect(result).toEqual({ msg: 'success' });
      expect(cookieMock).toHaveBeenCalledTimes(2);
    });

    it('should throw BadRequestException when cookie setting fails', async () => {
      cookieMock.mockImplementationOnce(() => {
        throw new Error();
      });

      await expect(service.signout(mockResponse)).rejects.toThrow(BadRequestException);
    });
  });
});
