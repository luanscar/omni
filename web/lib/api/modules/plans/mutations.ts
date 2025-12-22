import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { queryKeys } from '@/lib/query/keys'
import type { CreatePlanDto, UpdatePlanDto, SubscriptionPlan } from './types'

export function useCreatePlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreatePlanDto) =>
      apiClient.post<SubscriptionPlan>('/plans', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.plans.all() })
    },
  })
}

export function useUpdatePlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePlanDto }) =>
      apiClient.patch<SubscriptionPlan>(`/plans/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.plans.all() })
      queryClient.invalidateQueries({
        queryKey: queryKeys.plans.detail(variables.id),
      })
    },
  })
}

export function useDeletePlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/plans/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.plans.all() })
    },
  })
}

