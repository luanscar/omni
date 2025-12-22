import { PlanType } from '@/lib/api/types'

export interface CreatePlanDto {
  name: string
  type: PlanType
  description?: string
  maxUsers: number
  maxChannels: number
  maxConversations: number
  stripePriceId?: string
  stripeProductId?: string
  priceMonthly: number
}

export interface UpdatePlanDto {
  name?: string
  type?: PlanType
  description?: string
  maxUsers?: number
  maxChannels?: number
  maxConversations?: number
  stripePriceId?: string
  stripeProductId?: string
  priceMonthly?: number
}

export interface SubscriptionPlan {
  id: string
  name: string
  type: PlanType
  description?: string
  maxUsers: number
  maxChannels: number
  maxConversations: number
  stripePriceId: string
  stripeProductId: string
  priceMonthly: number
  active: boolean
  createdAt: string
  updatedAt: string
}

