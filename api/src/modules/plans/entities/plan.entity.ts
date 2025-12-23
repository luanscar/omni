import { ApiProperty } from '@nestjs/swagger';
import { PlanType } from 'prisma/generated/enums';

export class SubscriptionPlan {
  @ApiProperty({ example: 'fa4c178f-6595-40b9-a569-3d5c079288e5' })
  id: string;

  @ApiProperty({ example: 'Plano Básico' })
  name: string;

  @ApiProperty({
    enum: PlanType,
    example: PlanType.BASIC,
  })
  type: PlanType;

  @ApiProperty({
    example: 'Ideal para pequenas equipes',
    required: false,
  })
  description?: string;

  @ApiProperty({ example: 2 })
  maxUsers: number;

  @ApiProperty({ example: 1 })
  maxChannels: number;

  @ApiProperty({ example: 500 })
  maxConversations: number;

  @ApiProperty({ example: 'price_1234567890' })
  stripePriceId: string;

  @ApiProperty({ example: 'prod_1234567890' })
  stripeProductId: string;

  @ApiProperty({ example: 4990, description: 'Preço mensal em centavos' })
  priceMonthly: number;

  @ApiProperty({ example: true })
  active: boolean;

  @ApiProperty({ example: '2025-12-22T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-12-22T00:00:00.000Z' })
  updatedAt: Date;
}
