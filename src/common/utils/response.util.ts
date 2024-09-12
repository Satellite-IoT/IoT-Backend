import { ApiResponse } from '../types/api-response.interface';

export function createApiResponse<T>({
  success,
  message,
  data,
  error,
}: {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}): ApiResponse<T> {
  return {
    success,
    message,
    ...(data !== undefined && { data }),
    ...(error !== undefined && { error }),
  };
}
