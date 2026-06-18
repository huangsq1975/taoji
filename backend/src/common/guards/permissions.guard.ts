import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PERMISSIONS_KEY } from '../decorators/roles.decorator';
import { UserPermission } from '../../modules/users/user-permission.entity';
import { UserRole } from '../../modules/users/user.entity';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(UserPermission)
    private permissionRepo: Repository<UserPermission>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Admin always has all permissions
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    const userPermissions = await this.permissionRepo.find({
      where: { userId: user.sub },
    });

    const permissionSet = new Set(userPermissions.map((p) => p.permission));

    const hasAll = requiredPermissions.every((perm) => permissionSet.has(perm));
    if (!hasAll) {
      throw new ForbiddenException(`Missing required permissions: ${requiredPermissions.join(', ')}`);
    }

    return true;
  }
}
