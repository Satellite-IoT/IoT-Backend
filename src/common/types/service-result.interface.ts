import { ErrorCode } from '../enums/error-codes.enum';

export interface ServiceResult<T = undefined> {
  success: boolean;
  message?: string;
  data?: T;
  errorCode?: ErrorCode;
}
