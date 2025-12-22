import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { SubscriptionStatus } from 'prisma/generated/enums';

@Injectable()
export class SubscriptionGuard implements CanActivate {
    constructor(private prisma: PrismaService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user || !user.tenantId) {
            throw new ForbiddenException('Tenant não identificado');
        }

        const subscription = await this.prisma.subscription.findUnique({
            where: { tenantId: user.tenantId },
        });

        if (!subscription) {
            throw new ForbiddenException('Nenhuma assinatura encontrada');
        }

        const activeStatuses: SubscriptionStatus[] = [
            SubscriptionStatus.ACTIVE,
            SubscriptionStatus.TRIALING,
        ];

        if (!activeStatuses.includes(subscription.status)) {
            throw new ForbiddenException('Assinatura inativa ou expirada');
        }

        // Adicionar subscription ao request para uso posterior
        request.subscription = subscription;

        return true;
    }
}
