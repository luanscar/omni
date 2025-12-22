import {
    Controller,
    Post,
    Headers,
    RawBodyRequest,
    Req,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SubscriptionsService } from './subscriptions.service';
import Stripe from 'stripe';

@Controller('webhooks/stripe')
export class StripeWebhookController {
    private readonly logger = new Logger(StripeWebhookController.name);
    private stripe: Stripe;

    constructor(
        private subscriptionsService: SubscriptionsService,
        private configService: ConfigService,
    ) {
        this.stripe = new Stripe(
            this.configService.get<string>('STRIPE_SECRET_KEY'),
            { apiVersion: '2025-12-15.clover' },
        );
    }

    @Post()
    async handleWebhook(
        @Headers('stripe-signature') signature: string,
        @Req() req: RawBodyRequest<Request>,
    ) {
        const webhookSecret =
            this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

        if (!signature) {
            throw new BadRequestException('Missing stripe-signature header');
        }

        let event: Stripe.Event;

        try {
            // Verificar assinatura do webhook
            event = this.stripe.webhooks.constructEvent(
                req.rawBody,
                signature,
                webhookSecret,
            );
        } catch (err) {
            this.logger.error(
                `Webhook signature verification failed: ${err.message}`,
            );
            throw new BadRequestException('Webhook signature verification failed');
        }

        // Processar eventos
        try {
            switch (event.type) {
                case 'checkout.session.completed':
                    const session = event.data.object as Stripe.Checkout.Session;
                    await this.subscriptionsService.handleCheckoutCompleted(session);
                    this.logger.log(`Checkout completed for session ${session.id}`);
                    break;

                case 'customer.subscription.updated':
                    const updatedSubscription = event.data.object as Stripe.Subscription;
                    await this.subscriptionsService.handleSubscriptionUpdated(
                        updatedSubscription,
                    );
                    this.logger.log(`Subscription updated: ${updatedSubscription.id}`);
                    break;

                case 'customer.subscription.deleted':
                    const deletedSubscription = event.data.object as Stripe.Subscription;
                    await this.subscriptionsService.handleSubscriptionDeleted(
                        deletedSubscription,
                    );
                    this.logger.log(`Subscription deleted: ${deletedSubscription.id}`);
                    break;

                case 'invoice.payment_succeeded':
                    this.logger.log('Payment succeeded for invoice');
                    // Aqui você pode adicionar lógica adicional se necessário
                    break;

                case 'invoice.payment_failed':
                    this.logger.warn('Payment failed for invoice');
                    // Aqui você pode notificar o usuário sobre falha no pagamento
                    break;

                default:
                    this.logger.warn(`Unhandled event type: ${event.type}`);
            }

            return { received: true };
        } catch (error) {
            this.logger.error(`Error processing webhook: ${error.message}`);
            throw new BadRequestException('Error processing webhook');
        }
    }
}
