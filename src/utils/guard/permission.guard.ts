import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class PermissionGuard implements CanActivate {

  @Inject(Reflector)
  private reflector: Reflector

  @Inject(JwtService)
  private jwtService: JwtService

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {

    const request = context.switchToHttp().getRequest<Request & { user?: any }>();
    //user是LoginGuard添加
    if (!request.user) return true

    const requiredPermissions = this.reflector.getAllAndOverride('require-permission', [context.getClass(), context.getHandler()])
    if (!requiredPermissions) return true

    const permissions = request.user.permissions;

    for (let index = 0; index < requiredPermissions.length; index++) {
      const curPermission = requiredPermissions[index];
      const found = permissions.find((item) => curPermission === item.code)
      if (!found) {
        throw new UnauthorizedException('您没有访问该接口的权限')
      }
    }

    return true;
  }
}
