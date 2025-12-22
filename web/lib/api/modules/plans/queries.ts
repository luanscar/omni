import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { queryKeys } from '@/lib/query/keys'
import type { SubscriptionPlan } from './types'

export function usePlans() {
  return useQuery({
    queryKey: queryKeys.plans.all(),
    queryFn: () => apiClient.get<SubscriptionPlan[]>('/plans'),
  })
}

export function usePlan(id: string) {
  return useQuery({
    queryKey: queryKeys.plans.detail(id),
    queryFn: () => apiClient.get<SubscriptionPlan>(`/plans/${id}`),
    enabled: !!id,
  })
}

