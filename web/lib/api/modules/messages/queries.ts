import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { queryKeys } from '@/lib/query/keys'
import type { Message } from './types'

export function useMessagesByConversation(conversationId: string) {
  return useQuery({
    queryKey: queryKeys.messages.byConversation(conversationId),
    queryFn: () =>
      apiClient.get<Message[]>(
        `/messages/conversation/${conversationId}`
      ),
    enabled: !!conversationId,
  })
}

