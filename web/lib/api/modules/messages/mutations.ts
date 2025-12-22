import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { queryKeys } from '@/lib/query/keys'
import type {
  CreateMessageDto,
  BatchMessageDto,
  ForwardMessageDto,
  ForwardBatchDto,
  Message,
} from './types'

export function useCreateMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateMessageDto) =>
      apiClient.post<Message>('/messages', data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.messages.byConversation(variables.conversationId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversations.detail(variables.conversationId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversations.all(),
      })
    },
  })
}

export function useCreateBatchMessages() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: BatchMessageDto) =>
      apiClient.post<Message[]>('/messages/batch', data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.messages.byConversation(variables.conversationId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversations.detail(variables.conversationId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversations.all(),
      })
    },
  })
}

export function useForwardMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ForwardMessageDto) =>
      apiClient.post('/messages/forward', data),
    onSuccess: (_, variables) => {
      // Invalidar conversas de destino
      variables.targetConversationIds.forEach((conversationId) => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.messages.byConversation(conversationId),
        })
        queryClient.invalidateQueries({
          queryKey: queryKeys.conversations.detail(conversationId),
        })
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversations.all(),
      })
    },
  })
}

export function useForwardBatchMessages() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ForwardBatchDto) =>
      apiClient.post('/messages/forward/batch', data),
    onSuccess: (_, variables) => {
      // Invalidar conversas de destino
      variables.targetConversationIds.forEach((conversationId) => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.messages.byConversation(conversationId),
        })
        queryClient.invalidateQueries({
          queryKey: queryKeys.conversations.detail(conversationId),
        })
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversations.all(),
      })
    },
  })
}

