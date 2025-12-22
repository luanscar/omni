import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { queryKeys } from '@/lib/query/keys'
import type { Media, DownloadUrlResponse } from './types'

export function useStorageFiles() {
  return useQuery({
    queryKey: queryKeys.storage.all(),
    queryFn: () => apiClient.get<Media[]>('/storage'),
  })
}

export function useStorageDownloadUrl(id: string) {
  return useQuery({
    queryKey: queryKeys.storage.download(id),
    queryFn: () =>
      apiClient.get<DownloadUrlResponse>(`/storage/${id}/download`),
    enabled: !!id,
    retry: 1, // Tenta apenas 1 vez se falhar
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos (URLs presigned expiram em 1h)
  })
}

