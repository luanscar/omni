import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { queryKeys } from '@/lib/query/keys'
import type { Subscription } from './types'

export function useMySubscription() {
  return useQuery({
    queryKey: queryKeys.subscriptions.my(),
    queryFn: async () => {
      try {
        return await apiClient.get<Subscription>('/subscriptions/my-subscription')
      } catch (error: any) {
        // Se retornar 404, significa que não há subscription
        if (error?.response?.status === 404) {
          return null
        }
        throw error
      }
    },
    retry: (failureCount, error: any) => {
      // Não tentar novamente se for 404
      if (error?.response?.status === 404) {
        return false
      }
      return failureCount < 3
    },
  })
}

