import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { queryKeys } from '@/lib/query/keys'
import type {
  CreateCheckoutSessionDto,
  CheckoutSessionResponse,
} from './types'

export function useCreateCheckoutSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateCheckoutSessionDto) =>
      apiClient.post<CheckoutSessionResponse>(
        '/subscriptions/checkout',
        data
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.subscriptions.my(),
      })
    },
  })
}

export function useConfirmCheckoutSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (sessionId: string) =>
      apiClient.post<import('./types').Subscription>(
        '/subscriptions/confirm-session',
        { sessionId }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.subscriptions.my(),
      })
    },
  })
}

export function useCancelSubscription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => apiClient.delete('/subscriptions/cancel'),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.subscriptions.my(),
      })
    },
  })
}

