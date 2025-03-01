import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class CustomExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    response.statusCode = exception.getStatus();
    //当错误是由于pipe(class-validator)验证参数出错，错误提示存储在exception.response对象上
    //其他错误的message存储在exception.message上
    const res = exception.getResponse() as { message: string[] };

    response.json({
      code: exception.getStatus(),
      message: 'fail',
      data: res?.message?.join ? res?.message?.join(',') : exception.message
    }).end()
  }
}
