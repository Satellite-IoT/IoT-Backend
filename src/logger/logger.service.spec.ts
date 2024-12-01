import { LoggerService } from './logger.service';
import * as winston from 'winston';

jest.mock('winston', () => {
  const mockFormat = {
    printf: jest.fn().mockReturnValue(jest.fn()),
    combine: jest.fn(),
    timestamp: jest.fn(),
    splat: jest.fn(),
    json: jest.fn(),
    colorize: jest.fn(),
    simple: jest.fn(),
  };

  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  return {
    createLogger: jest.fn().mockReturnValue(mockLogger),
    format: mockFormat,
    transports: {
      Console: jest.fn(),
      DailyRotateFile: jest.fn(),
    },
  };
});

describe('LoggerService', () => {
  let service: LoggerService;
  let mockLogger: any;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new LoggerService();
    mockLogger = (winston.createLogger as jest.Mock)();
  });

  describe('logFormat', () => {
    it('should format log message correctly with all parameters', () => {
      // 直接測試 winston.format.printf 的回調函數
      const formatFn = (winston.format.printf as jest.Mock).mock.calls[0][0];

      const result = formatFn({
        timestamp: '2024-01-01',
        level: 'info',
        message: 'test message',
        context: 'TestContext',
        trace: 'test trace',
        requestBody: { test: 'data' },
      });

      expect(result).toBe(
        '2024-01-01 [TestContext] info: test message\n' + 'Trace: test trace\n' + 'Request Body: {"test":"data"}',
      );
    });

    it('should format log message correctly without optional parameters', () => {
      const formatFn = (winston.format.printf as jest.Mock).mock.calls[0][0];

      const result = formatFn({
        timestamp: '2024-01-01',
        level: 'info',
        message: 'test message',
        context: 'TestContext',
      });

      expect(result).toBe('2024-01-01 [TestContext] info: test message');
    });
  });

  describe('log method', () => {
    it('should call info with correct parameters', () => {
      const message = 'test message';
      const context = 'TestContext';
      const requestBody = { test: 'data' };

      service.log(message, context, requestBody);

      expect(mockLogger.info).toHaveBeenCalledWith({
        message,
        context,
        requestBody,
      });
    });

    it('should work without optional parameters', () => {
      const message = 'test message';

      service.log(message);

      expect(mockLogger.info).toHaveBeenCalledWith({
        message,
        context: undefined,
        requestBody: undefined,
      });
    });
  });

  describe('error method', () => {
    it('should call error with correct parameters', () => {
      const message = 'error message';
      const trace = 'error trace';
      const context = 'ErrorContext';
      const requestBody = { error: 'data' };

      service.error(message, trace, context, requestBody);

      const expectedParams = {
        message,
        trace,
        context,
        requestBody,
      };

      expect(mockLogger.error).toHaveBeenCalledWith(expectedParams);
    });
  });

  describe('warn method', () => {
    it('should call warn with correct parameters', () => {
      const message = 'warning message';
      const context = 'WarnContext';
      const requestBody = { warn: 'data' };

      service.warn(message, context, requestBody);

      const expectedParams = {
        message,
        context,
        requestBody,
      };

      expect(mockLogger.warn).toHaveBeenCalledWith(expectedParams);
    });
  });

  describe('debug method', () => {
    it('should call debug with correct parameters', () => {
      const message = 'debug message';
      const context = 'DebugContext';
      const requestBody = { debug: 'data' };

      service.debug(message, context, requestBody);

      expect(mockLogger.debug).toHaveBeenCalledWith({
        message,
        context,
        requestBody,
      });
    });
  });
});
