import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma.service';
import { PlansService } from '../plans/plans.service';
import Stripe from 'stripe';
import { SubscriptionStatus } from 'prisma/generated/enums';

@Injectable()
export class SubscriptionsService {
    private stripe: Stripe;

    constructor(
        private prisma: PrismaService,
        private plansService: PlansService,
        private configService: ConfigService,
    ) {
        this.stripe = new Stripe(
            this.configService.get<string>('STRIPE_SECRET_KEY'),
            { apiVersion: '2025-12-15.clover' },
        );
    }

    async createCheckoutSession(
        tenantId: string,
        planId: string,
        successUrl?: string,
        cancelUrl?: string,
    ) {
        const plan = await this.plansService.findOne(planId);

        if (!plan) {
            throw new NotFoundException('Plano não encontrado');
        }

        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
        });

        if (!tenant) {
            throw new NotFoundException('Tenant não encontrado');
        }

        // Verificar se já tem assinatura ativa
        const existingSubscription = await this.prisma.subscription.findUnique({
            where: { tenantId },
        });

        if (
            existingSubscription &&
            existingSubscription.status === SubscriptionStatus.ACTIVE
        ) {
            throw new BadRequestException('Tenant já possui assinatura ativa');
        }

        // Criar sessão de checkout no Stripe
        const session = await this.stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: plan.stripePriceId,
                    quantity: 1,
                },
            ],
            success_url:
                successUrl ||
                `${this.configService.get('APP_URL')}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url:
                cancelUrl || `${this.configService.get('APP_URL')}/subscription/cancel`,
            client_reference_id: tenantId,
            metadata: {
                tenantId,
                planId,
            },
            subscription_data: {
                trial_period_days: 14, // 14 dias de trial
                metadata: {
                    tenantId,
                    planId,
                },
            },
        });

        return {
            sessionId: session.id,
            url: session.url,
        };
    }

    async findByTenant(tenantId: string) {
        return this.prisma.subscription.findUnique({
            where: { tenantId },
            include: { plan: true },
        });
    }

    async cancelSubscription(tenantId: string) {
        const subscription = await this.findByTenant(tenantId);

        if (!subscription) {
            throw new NotFoundException('Assinatura não encontrada');
        }

        if (subscription.stripeSubscriptionId) {
            // Cancelar no Stripe
            await this.stripe.subscriptions.update(
                subscription.stripeSubscriptionId,
                {
                    cancel_at_period_end: true,
                },
            );
        }

        return this.prisma.subscription.update({
            where: { tenantId },
            data: {
                cancelAtPeriodEnd: true,
            },
        });
    }

    // Métodos chamados pelos webhooks
    async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
        const tenantId = session.client_reference_id;
        const planId = session.metadata.planId;
        const stripeSubscriptionId = session.subscription as string;

        // Buscar detalhes da subscription no Stripe
        const stripeSubscription =
            await this.stripe.subscriptions.retrieve(stripeSubscriptionId);

        // Criar ou atualizar subscription no banco
        await this.prisma.subscription.upsert({
            where: { tenantId },
            create: {
                tenantId,
                planId,
                stripeCustomerId: session.customer as string,
                stripeSubscriptionId,
                status: this.mapStripeStatus(stripeSubscription.status),
                currentPeriodStart: new Date(
                    (stripeSubscription as any).current_period_start * 1000,
                ),
                currentPeriodEnd: new Date(
                    (stripeSubscription as any).current_period_end * 1000,
                ),
                trialEnd: stripeSubscription.trial_end
                    ? new Date(stripeSubscription.trial_end * 1000)
                    : null,
            },
            update: {
                planId,
                stripeCustomerId: session.customer as string,
                stripeSubscriptionId,
                status: this.mapStripeStatus(stripeSubscription.status),
                currentPeriodStart: new Date(
                    (stripeSubscription as any).current_period_start * 1000,
                ),
                currentPeriodEnd: new Date(
                    (stripeSubscription as any).current_period_end * 1000,
                ),
                trialEnd: stripeSubscription.trial_end
                    ? new Date(stripeSubscription.trial_end * 1000)
                    : null,
            },
        });
    }

    async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
        await this.prisma.subscription.update({
            where: { stripeSubscriptionId: subscription.id },
            data: {
                status: this.mapStripeStatus(subscription.status),
                currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
                currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
                cancelAtPeriodEnd: subscription.cancel_at_period_end,
                canceledAt: subscription.canceled_at
                    ? new Date(subscription.canceled_at * 1000)
                    : null,
            },
        });
    }

    async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
        await this.prisma.subscription.update({
            where: { stripeSubscriptionId: subscription.id },
            data: {
                status: SubscriptionStatus.CANCELED,
                canceledAt: new Date(),
            },
        });
    }

    private mapStripeStatus(stripeStatus: string): SubscriptionStatus {
        const statusMap: Record<string, SubscriptionStatus> = {
            active: SubscriptionStatus.ACTIVE,
            canceled: SubscriptionStatus.CANCELED,
            past_due: SubscriptionStatus.PAST_DUE,
            trialing: SubscriptionStatus.TRIALING,
            incomplete: SubscriptionStatus.INCOMPLETE,
            incomplete_expired: SubscriptionStatus.INCOMPLETE_EXPIRED,
            unpaid: SubscriptionStatus.UNPAID,
        };

        return statusMap[stripeStatus] || SubscriptionStatus.INCOMPLETE;
    }
}
