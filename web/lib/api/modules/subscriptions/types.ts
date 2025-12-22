import { SubscriptionStatus, PlanType } from '@/lib/api/types'

export interface CreateCheckoutSessionDto {
  planId: string
  successUrl?: string
  cancelUrl?: string
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

export interface Subscription {
  id: string
  tenantId: string
  planId: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  stripeCustomerId: string
  stripeSubscriptionId: string
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  trialEnd?: string
  createdAt: string
  updatedAt: string
}

export interface CheckoutSessionResponse {
  url: string
  sessionId: string
}

