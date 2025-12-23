import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionStatus } from 'prisma/generated/enums';
import { SubscriptionPlan } from 'src/modules/plans/entities/plan.entity';

export class Subscription {
  @ApiProperty({ example: 'fa4c178f-6595-40b9-a569-3d5c079288e5' })
  id: string;

  @ApiProperty({ example: 'fa4c178f-6595-40b9-a569-3d5c079288e5' })
  tenantId: string;

  @ApiProperty({ example: 'fa4c178f-6595-40b9-a569-3d5c079288e5' })
  planId: string;

  @ApiProperty({
    type: () => SubscriptionPlan,
    required: false,
  })
  plan?: SubscriptionPlan;

  @ApiProperty({
    enum: SubscriptionStatus,
    example: SubscriptionStatus.ACTIVE,
  })
  status: SubscriptionStatus;

  @ApiProperty({
    example: 'cus_1234567890',
    required: false,
  })
  stripeCustomerId?: string;

  @ApiProperty({
    example: 'sub_1234567890',
    required: false,
  })
  stripeSubscriptionId?: string;

  @ApiProperty({
    example: '2025-12-22T00:00:00.000Z',
    required: false,
  })
  currentPeriodStart?: Date;

  @ApiProperty({
    example: '2026-01-22T00:00:00.000Z',
    required: false,
  })
  currentPeriodEnd?: Date;

  @ApiProperty({ example: false })
  cancelAtPeriodEnd: boolean;

  @ApiProperty({
    example: '2026-01-05T00:00:00.000Z',
    required: false,
  })
  trialEnd?: Date;

  @ApiProperty({ example: '2025-12-22T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-12-22T00:00:00.000Z' })
  updatedAt: Date;
}
