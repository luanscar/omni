import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { queryKeys } from '@/lib/query/keys'
import type { Conversation } from './types'

export type ConversationFilters = {
  status?: string
  search?: string
  page?: number
  limit?: number
}

export function useConversations(filters: ConversationFilters = {}) {
  return useQuery({
    queryKey: queryKeys.conversations.list(filters),
    queryFn: () => {
      const params = new URLSearchParams()
      if (filters.status) params.append('status', filters.status)
      if (filters.search) params.append('search', filters.search)
      if (filters.page) params.append('page', filters.page.toString())
      if (filters.limit) params.append('limit', filters.limit.toString())

      return apiClient.get<Conversation[]>(`/conversations?${params.toString()}`)
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

