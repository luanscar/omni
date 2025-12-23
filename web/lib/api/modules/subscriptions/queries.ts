import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { queryKeys } from '@/lib/query/keys'
import type { Subscription } from './types'

import { AxiosError } from 'axios'

export function useMySubscription() {
  return useQuery({
    queryKey: queryKeys.subscriptions.my(),
    queryFn: async () => {
      try {
        return await apiClient.get<Subscription>('/subscriptions/my-subscription')
      } catch (error: unknown) {
        const axiosError = error as AxiosError
        // Se retornar 404, significa que não há subscription
        if (axiosError?.response?.status === 404) {
          return null
        }
        throw error
      }
    },
    retry: (failureCount, error: unknown) => {
      const axiosError = error as AxiosError
      // Não tentar novamente se for 404
      if (axiosError?.response?.status === 404) {
        return false
      }
      return failureCount < 3
    },
  })
}

