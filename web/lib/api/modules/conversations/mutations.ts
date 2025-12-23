import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { queryKeys } from '@/lib/query/keys'
import type {
  CreateConversationDto,
  UpdateConversationDto,
  Conversation,
} from './types'

export function useCreateConversation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateConversationDto) =>
      apiClient.post<Conversation>('/conversations', data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversations.all(),
      })
    },
  })
}

export function useUpdateConversation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: UpdateConversationDto
    }) => apiClient.patch<Conversation>(`/conversations/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversations.all(),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversations.detail(variables.id),
      })
    },
  })
}

export function useMarkMessagesAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (conversationId: string) => {
      console.log('[useMarkMessagesAsRead] Marking messages as read for conversation:', conversationId)
      return apiClient.patch(`/messages/conversation/${conversationId}/mark-as-read`, {})
    },
    onSuccess: () => {
      // Invalidar a listagem de conversas para atualizar a contagem
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversations.all(),
      })
    },
    onError: (error: any) => {
      // Tentar extrair todas as propriedades possíveis do erro
      const errorDetails = {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        name: error?.name,
        stack: error?.stack,
        code: error?.code,
        config: error?.config,
        toString: error?.toString?.(),
        keys: Object.keys(error || {}),
        ownProps: Object.getOwnPropertyNames(error || {}),
        rawError: error,
      }
      console.error('Error marking messages as read:', errorDetails)
    },
  })
}
