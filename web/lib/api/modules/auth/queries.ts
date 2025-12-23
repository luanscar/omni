import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { queryKeys } from '@/lib/query/keys'
import type { User } from './types'

export function useMe() {
  return useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: () => apiClient.get<User>('/auth/me'),
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  })
}

