import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from 'prisma/generated/client';

type RequestWithUser = {
  user: User;
};

/**
 * Este decorator customizado facilita pegar o objeto 'user'
 * que o JwtStrategy anexou ao request.
 *
 * Em vez de @Req() req: Request e depois req.user,
 * você pode usar @CurrentUser() user: User
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);
