import { Injectable, Scope } from '@nestjs/common';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService {
  private logger: winston.Logger;
  private errorLogger: winston.Logger;

  constructor() {
    const fileRotateTransport = new winston.transports.DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
    });

    const errorFileRotateTransport = new winston.transports.DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      level: 'warn',
    });

    const logFormat = winston.format.printf(({ timestamp, level, message, context, trace, requestBody }) => {
      let logMessage = `${timestamp} [${context}] ${level}: ${message}`;
      if (trace) {
        logMessage += `\nTrace: ${trace}`;
      }
      if (requestBody) {
        logMessage += `\nRequest Body: ${JSON.stringify(requestBody)}`;
      }
      return logMessage;
    });

    const commonFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.splat(),
      winston.format.json(),
      logFormat,
    );

    this.logger = winston.createLogger({
      level: 'info',
      format: commonFormat,
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
        }),
        fileRotateTransport,
      ],
    });

    this.errorLogger = winston.createLogger({
      level: 'warn',
      format: commonFormat,
      transports: [errorFileRotateTransport],
    });
  }

  log(message: string, context?: string, requestBody?: any) {
    this.logger.info({ message, context, requestBody });
  }

  error(message: string, trace: string, context?: string, requestBody?: any) {
    const errorMessage = { message, trace, context, requestBody };
    this.logger.error(errorMessage);
    this.errorLogger.error(errorMessage);
  }

  warn(message: string, context?: string, requestBody?: any) {
    const warnMessage = { message, context, requestBody };
    this.logger.warn(warnMessage);
    this.errorLogger.warn(warnMessage);
  }

  debug(message: string, context?: string, requestBody?: any) {
    this.logger.debug({ message, context, requestBody });
  }
}
