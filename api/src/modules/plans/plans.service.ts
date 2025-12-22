import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { PlanType } from 'prisma/generated/enums';
import Stripe from 'stripe';

@Injectable()
export class PlansService {
    private stripe: Stripe;

    constructor(
        private prisma: PrismaService,
        private configService: ConfigService,
    ) {
        this.stripe = new Stripe(
            this.configService.get<string>('STRIPE_SECRET_KEY'),
            { apiVersion: '2025-12-15.clover' },
        );
    }

    async create(data: CreatePlanDto) {
        // Verificar se já existe um plano do mesmo tipo
        const existingPlan = await this.prisma.subscriptionPlan.findUnique({
            where: { type: data.type },
        });

        if (existingPlan) {
            throw new ConflictException(
                `Já existe um plano do tipo ${data.type}.`
            );
        }

        let stripePriceId = data.stripePriceId;
        let stripeProductId = data.stripeProductId;

        // Se não foi fornecido IDs do Stripe, criar automaticamente
        if (!stripePriceId || !stripeProductId) {
            // Criar produto no Stripe
            const product = await this.stripe.products.create({
                name: data.name,
                description: data.description || `Plano ${data.type}`,
                metadata: {
                    planType: data.type,
                    maxUsers: data.maxUsers.toString(),
                    maxChannels: data.maxChannels.toString(),
                    maxConversations: data.maxConversations.toString(),
                },
            });

            stripeProductId = product.id;

            // Criar preço recorrente mensal
            const price = await this.stripe.prices.create({
                product: stripeProductId,
                unit_amount: data.priceMonthly,
                currency: 'brl',
                recurring: {
                    interval: 'month',
                },
                metadata: {
                    planType: data.type,
                },
            });

            stripePriceId = price.id;
        }

        // Criar plano no banco com os IDs do Stripe
        return this.prisma.subscriptionPlan.create({
            data: {
                name: data.name,
                type: data.type,
                description: data.description,
                maxUsers: data.maxUsers,
                maxChannels: data.maxChannels,
                maxConversations: data.maxConversations,
                stripePriceId,
                stripeProductId,
                priceMonthly: data.priceMonthly,
            },
        });
    }

    async findAll() {
        return this.prisma.subscriptionPlan.findMany({
            where: { active: true },
            orderBy: { priceMonthly: 'asc' },
        });
    }

    async findOne(id: string) {
        const plan = await this.prisma.subscriptionPlan.findUnique({
            where: { id },
        });

        if (!plan) {
            throw new NotFoundException('Plano não encontrado');
        }

        return plan;
    }

    async findByType(type: PlanType) {
        return this.prisma.subscriptionPlan.findUnique({
            where: { type },
        });
    }

    async update(id: string, data: UpdatePlanDto) {
        await this.findOne(id); // Valida se existe

        return this.prisma.subscriptionPlan.update({
            where: { id },
            data,
        });
    }

    async remove(id: string) {
        await this.findOne(id);

        // Soft delete - apenas desativa
        return this.prisma.subscriptionPlan.update({
            where: { id },
            data: { active: false },
        });
    }
}
