import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { queryKeys } from '@/lib/query/keys'
import type { CreateChannelDto, UpdateChannelDto, Channel } from './types'

export function useCreateChannel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateChannelDto) =>
      apiClient.post<Channel>('/channels', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.channels.all() })
    },
  })
}

export function useUpdateChannel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateChannelDto }) =>
      apiClient.patch<Channel>(`/channels/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.channels.all() })
      queryClient.invalidateQueries({
        queryKey: queryKeys.channels.detail(variables.id),
      })
    },
  })
}

export function useDeleteChannel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/channels/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.channels.all() })
    },
  })
}

