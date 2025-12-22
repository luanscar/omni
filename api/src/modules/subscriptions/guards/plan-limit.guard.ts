import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from 'src/prisma.service';
import {
    PLAN_LIMIT_KEY,
    PlanLimitResource,
} from '../decorators/check-plan-limit.decorator';

@Injectable()
export class PlanLimitGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private prisma: PrismaService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const resource = this.reflector.getAllAndOverride<PlanLimitResource>(
            PLAN_LIMIT_KEY,
            [context.getHandler(), context.getClass()],
        );

        // Se não tem decorator @CheckPlanLimit, não precisa validar
        if (!resource) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user || !user.tenantId) {
            throw new ForbiddenException('Tenant não identificado');
        }

        // Buscar assinatura com plano
        const subscription = await this.prisma.subscription.findUnique({
            where: { tenantId: user.tenantId },
            include: { plan: true },
        });

        if (!subscription || !subscription.plan) {
            throw new ForbiddenException(
                'Assinatura não encontrada. Configure um plano para este tenant.',
            );
        }

        // Validar limite baseado no recurso
        await this.validateLimit(user.tenantId, resource, subscription.plan);

        return true;
    }

    private async validateLimit(
        tenantId: string,
        resource: PlanLimitResource,
        plan: any,
    ) {
        let currentCount = 0;
        let maxLimit = 0;
        let resourceName = '';

        switch (resource) {
            case 'channels':
                currentCount = await this.prisma.channel.count({
                    where: { tenantId },
                });
                maxLimit = plan.maxChannels;
                resourceName = 'canais';
                break;

            case 'users':
                currentCount = await this.prisma.user.count({
                    where: { tenantId },
                });
                maxLimit = plan.maxUsers;
                resourceName = 'usuários';
                break;

            case 'conversations':
                // Contar conversas do mês atual
                const startOfMonth = new Date();
                startOfMonth.setDate(1);
                startOfMonth.setHours(0, 0, 0, 0);

                currentCount = await this.prisma.conversation.count({
                    where: {
                        tenantId,
                        createdAt: {
                            gte: startOfMonth,
                        },
                    },
                });
                maxLimit = plan.maxConversations;
                resourceName = 'conversas no mês';
                break;
        }

        if (currentCount >= maxLimit) {
            throw new ForbiddenException(
                `Limite de ${maxLimit} ${resourceName} atingido para o plano ${plan.type}. ` +
                `Atualmente você tem ${currentCount} ${resourceName}. ` +
                `Faça upgrade do seu plano para criar mais.`,
            );
        }
    }
}
