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

