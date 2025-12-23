import { useInfiniteQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { queryKeys } from '@/lib/query/keys'
import type { Message } from './types'

type MessagesResponse = {
  data: Message[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export function useMessagesByConversation(conversationId: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.messages.byConversation(conversationId),
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1 }) => {
      // Nota: Assumindo que a API suporta ?page=X&limit=Y. 
      // Se não suportar, precisaremos ajustar o endpoint.
      return apiClient.get<MessagesResponse>(
        `/messages/conversation/${conversationId}?page=${pageParam}&limit=20`
      )
    },
    getNextPageParam: (lastPage) => {
      return lastPage.meta.page < lastPage.meta.totalPages
        ? lastPage.meta.page + 1
        : undefined
    },
    enabled: !!conversationId,
  })
}

