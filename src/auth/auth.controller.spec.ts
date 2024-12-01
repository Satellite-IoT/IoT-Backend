import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthSignInDto, AuthSignUpDto } from './dto';
import { Response } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockResponse = {
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
  } as unknown as Response;

  const mockAuthService = {
    signin: jest.fn(),
    signup: jest.fn(),
    signout: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signin', () => {
    it('should call authService.signin with correct parameters', async () => {
      const signInDto: AuthSignInDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      const expectedResult = { token: 'mockToken' };

      mockAuthService.signin.mockResolvedValue(expectedResult);

      const result = await controller.signin(signInDto, mockResponse);

      expect(authService.signin).toHaveBeenCalledWith(signInDto, mockResponse);
      expect(result).toEqual(expectedResult);
    });

    it('should handle signin error', async () => {
      const signInDto: AuthSignInDto = {
        email: 'test@example.com',
        password: 'wrong-password',
      };

      const error = new Error('Invalid credentials');
      mockAuthService.signin.mockRejectedValue(error);

      await expect(controller.signin(signInDto, mockResponse)).rejects.toThrow('Invalid credentials');
    });
  });

  describe('signup', () => {
    it('should call authService.signup with correct parameters', async () => {
      const signUpDto: AuthSignUpDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      const expectedResult = { id: 1, email: 'test@example.com' };

      mockAuthService.signup.mockResolvedValue(expectedResult);

      const result = await controller.signup(signUpDto);

      expect(authService.signup).toHaveBeenCalledWith(signUpDto);
      expect(result).toEqual(expectedResult);
    });

    it('should handle signup error when email already exists', async () => {
      const signUpDto: AuthSignUpDto = {
        email: 'existing@example.com',
        password: 'password123',
      };

      const error = new Error('Email already exists');
      mockAuthService.signup.mockRejectedValue(error);

      await expect(controller.signup(signUpDto)).rejects.toThrow('Email already exists');
    });
  });

  describe('signout', () => {
    it('should call authService.signout with response object', () => {
      controller.signout(mockResponse);
      expect(authService.signout).toHaveBeenCalledWith(mockResponse);
    });
  });
});
