import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { queryKeys } from '@/lib/query/keys'
import type { User } from './types'

export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users.all(),
    queryFn: () => apiClient.get<User[]>('/users'),
  })
}

export function useUser(id: string) {
  return useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: () => apiClient.get<User>(`/users/${id}`),
    enabled: !!id,
  })
}

