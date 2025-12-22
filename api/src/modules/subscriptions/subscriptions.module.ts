import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { StripeWebhookController } from './stripe-webhook.controller';
import { PrismaService } from 'src/prisma.service';
import { PlansModule } from '../plans/plans.module';

@Module({
    imports: [ConfigModule, PlansModule],
    controllers: [SubscriptionsController, StripeWebhookController],
    providers: [SubscriptionsService, PrismaService],
    exports: [SubscriptionsService],
})
export class SubscriptionsModule { }
