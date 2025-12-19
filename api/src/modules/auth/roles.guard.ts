// src/auth/roles.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from 'src/common/decorators/roles.decorator';
import { User } from '../users/entities/user.entity';
import { UserRole } from 'prisma/generated/enums';

type RequestWithUser = {
  user?: Pick<User, 'role'>;
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // rota não exige papel específico
    }

    const { user } = context.switchToHttp().getRequest<RequestWithUser>();
    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Acesso não autorizado para este perfil');
    }

    return true;
  }
}
