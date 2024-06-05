import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
// import { Permission } from '../user/entities/permission.entity';

@Injectable()
export class LoginGuard implements CanActivate {

  @Inject()
  private reflector: Reflector;

  @Inject(JwtService)
  private jwtService: JwtService

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {

    const request = context.switchToHttp().getRequest<Request & { user?: any }>();
    //当controller的整个class或者某个请求的hander有登录需求时
    const requireLogin = this.reflector.getAllAndOverride('require-login', [context.getClass(), context.getHandler()])

    if (!requireLogin) return true;

    const authorization = request.headers.authorization;

    if (!authorization) throw new UnauthorizedException('用户未登录');

    try {
      const token = authorization.split(' ')[1];
      const data = this.jwtService.verify(token)
      request.user = {
        userId: data.userId,
        username: data.username,
        roles: data.roles,
        permissions: data.permissions
      }
      return true;
    } catch (error) {
      throw new UnauthorizedException('token 失效，请重新登录');
    }

  }
}
