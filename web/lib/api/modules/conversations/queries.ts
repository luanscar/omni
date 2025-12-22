import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { queryKeys } from '@/lib/query/keys'
import type { Conversation } from './types'

export function useConversations(status?: string) {
  return useQuery({
    queryKey: queryKeys.conversations.byStatus(status),
    queryFn: () => {
      const params = status ? `?status=${status}` : ''
      return apiClient.get<Conversation[]>(`/conversations${params}`)
    },
  })
}

export function useConversation(id: string) {
  return useQuery({
    queryKey: queryKeys.conversations.detail(id),
    queryFn: () => apiClient.get<Conversation>(`/conversations/${id}`),
    enabled: !!id,
  })
}

