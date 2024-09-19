import { Injectable, NestInterceptor, ExecutionContext, CallHandler, BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface PrivateData {
      user_id: number;
    }

    interface Request {
      privateData?: PrivateData | undefined;
    }
  }
}
@Injectable()
export class PrivateDataInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest() as Request;

    const dataString = request.header('private-data');
    if (!dataString) {
      request.privateData = undefined;
    } else {
      const dataContent = JSON.parse(dataString) as Express.PrivateData;
      request.privateData = dataContent;
    }

    return next.handle();
  }
}
