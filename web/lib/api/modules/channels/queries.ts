import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { queryKeys } from '@/lib/query/keys'
import type { Channel } from './types'

export function useChannels() {
  return useQuery({
    queryKey: queryKeys.channels.all(),
    queryFn: () => apiClient.get<Channel[]>('/channels'),
  })
}

export function useChannel(id: string) {
  return useQuery({
    queryKey: queryKeys.channels.detail(id),
    queryFn: () => apiClient.get<Channel>(`/channels/${id}`),
    enabled: !!id,
  })
}

