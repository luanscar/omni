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

  async confirmCheckoutSession(sessionId: string, tenantId: string) {
    // Buscar a sessão no Stripe
    const session = await this.stripe.checkout.sessions.retrieve(sessionId);

    // Verificar se a sessão pertence ao tenant
    if (session.client_reference_id !== tenantId) {
      throw new BadRequestException('Sessão não pertence a este tenant');
    }

    // Verificar se a sessão foi completada
    if (session.payment_status !== 'paid' && session.status !== 'complete') {
      throw new BadRequestException('Sessão ainda não foi completada');
    }

    // Se já existe subscription para este tenant, retornar ela
    const existingSubscription = await this.findByTenant(tenantId);
    if (existingSubscription) {
      return existingSubscription;
    }

    // Processar a sessão (similar ao webhook)
    if (session.subscription) {
      await this.handleCheckoutCompleted(session);
      return this.findByTenant(tenantId);
    }

    throw new BadRequestException('Sessão não possui subscription associada');
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
    // Validar e converter datas do Stripe (podem ser null/undefined em trials)
    // Verificar se o valor existe E é um número válido antes de criar a Date
    const stripeSub = stripeSubscription as any;
    const currentPeriodStart =
      stripeSub.current_period_start &&
      typeof stripeSub.current_period_start === 'number' &&
      !isNaN(stripeSub.current_period_start)
        ? new Date(stripeSub.current_period_start * 1000)
        : null;
    const currentPeriodEnd =
      stripeSub.current_period_end &&
      typeof stripeSub.current_period_end === 'number' &&
      !isNaN(stripeSub.current_period_end)
        ? new Date(stripeSub.current_period_end * 1000)
        : null;
    const trialEnd =
      stripeSub.trial_end &&
      typeof stripeSub.trial_end === 'number' &&
      !isNaN(stripeSub.trial_end)
        ? new Date(stripeSub.trial_end * 1000)
        : null;

    await this.prisma.subscription.upsert({
      where: { tenantId },
      create: {
        tenantId,
        planId,
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId,
        status: this.mapStripeStatus(stripeSubscription.status),
        currentPeriodStart,
        currentPeriodEnd,
        trialEnd,
      },
      update: {
        planId,
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId,
        status: this.mapStripeStatus(stripeSubscription.status),
        currentPeriodStart,
        currentPeriodEnd,
        trialEnd,
      },
    });
  }

  async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    // Validar e converter datas do Stripe (podem ser null/undefined em trials)
    // Verificar se o valor existe E é um número válido antes de criar a Date
    const stripeSub = subscription as any;
    const currentPeriodStart =
      stripeSub.current_period_start &&
      typeof stripeSub.current_period_start === 'number' &&
      !isNaN(stripeSub.current_period_start)
        ? new Date(stripeSub.current_period_start * 1000)
        : null;
    const currentPeriodEnd =
      stripeSub.current_period_end &&
      typeof stripeSub.current_period_end === 'number' &&
      !isNaN(stripeSub.current_period_end)
        ? new Date(stripeSub.current_period_end * 1000)
        : null;
    const canceledAt =
      stripeSub.canceled_at &&
      typeof stripeSub.canceled_at === 'number' &&
      !isNaN(stripeSub.canceled_at)
        ? new Date(stripeSub.canceled_at * 1000)
        : null;

    await this.prisma.subscription.update({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: this.mapStripeStatus(subscription.status),
        currentPeriodStart,
        currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        canceledAt,
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
