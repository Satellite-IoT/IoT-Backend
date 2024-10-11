import { HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../enums/error-codes.enum';

export function mapErrorCodeToHttpStatus(errorCode: ErrorCode): HttpStatus {
  switch (errorCode) {
    // 4xx Client Errors
    // case ErrorCode.BAD_REQUEST:
    // case ErrorCode.INVALID_INPUT:
    // case ErrorCode.VALIDATION_ERROR:
    case ErrorCode.INVALID_DATE_PARAMETERS:
      return HttpStatus.BAD_REQUEST; // 400

    case ErrorCode.UNAUTHORIZED:
    case ErrorCode.AUTHENTICATION_FAILED:
      return HttpStatus.UNAUTHORIZED; // 401

    // case ErrorCode.FORBIDDEN:
    // case ErrorCode.PERMISSION_DENIED:
    //   return HttpStatus.FORBIDDEN; // 403

    case ErrorCode.DEVICE_NOT_FOUND:
      return HttpStatus.NOT_FOUND; // 404

    case ErrorCode.DEVICE_ALREADY_EXISTS:
    case ErrorCode.DEVICE_ALREADY_REGISTERED:
      return HttpStatus.CONFLICT; // 409

    // 5xx Server Errors
    case ErrorCode.INTERNAL_SERVER_ERROR:
      return HttpStatus.INTERNAL_SERVER_ERROR; // 500

    // Default case
    default:
      console.warn(`Unhandled error code: ${errorCode}`);
      return HttpStatus.INTERNAL_SERVER_ERROR; // 500
  }
}
