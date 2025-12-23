import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { queryKeys } from '@/lib/query/keys'
import type {
  CreateConversationDto,
  UpdateConversationDto,
  Conversation,
} from './types'
import { ConversationStatus } from '@/lib/api/types'

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

export function useStartConversation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      conversationId,
      assigneeId,
    }: {
      conversationId: string
      assigneeId: string
    }) => {
      return apiClient.patch<Conversation>(`/conversations/${conversationId}`, {
        status: ConversationStatus.OPEN,
        assigneeId,
      })
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversations.all(),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversations.detail(variables.conversationId),
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
    onError: (error: unknown) => {
      // Tentar extrair todas as propriedades possíveis do erro
      const errorDetails: Record<string, unknown> = {}
      
      if (error && typeof error === 'object') {
        const err = error as Record<string, unknown>
        errorDetails.message = err.message
        if (err.response && typeof err.response === 'object') {
          const response = err.response as Record<string, unknown>
          errorDetails.response = response.data
          errorDetails.status = response.status
        }
        errorDetails.name = err.name
        errorDetails.stack = err.stack
        errorDetails.code = err.code
        errorDetails.config = err.config
        if (typeof err.toString === 'function') {
          errorDetails.toStringValue = err.toString()
        }
        errorDetails.keys = Object.keys(err)
        errorDetails.ownProps = Object.getOwnPropertyNames(err)
        errorDetails.rawError = err
      } else {
        errorDetails.rawError = error
      }
      
      console.error('Error marking messages as read:', errorDetails)
    },
  })
}
