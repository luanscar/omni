import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { queryKeys } from '@/lib/query/keys'
import type { Media } from './types'

export function useUploadFile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      file,
      category,
    }: {
      file: File
      category: string
    }): Promise<Media> => {
      const formData = new FormData()
      formData.append('file', file)

      return apiClient.post<Media>(
        `/storage/upload?category=${category}`,
        formData
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.storage.all() })
    },
  })
}

export function useUploadBatchFiles() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      files,
      category,
    }: {
      files: File[]
      category: string
    }): Promise<Media[]> => {
      const formData = new FormData()
      files.forEach((file) => {
        formData.append('files', file)
      })

      return apiClient.post<Media[]>(
        `/storage/upload/batch?category=${category}`,
        formData
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.storage.all() })
    },
  })
}

export function useDeleteFile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/storage/${id}`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.storage.all() })
      queryClient.invalidateQueries({
        queryKey: queryKeys.storage.detail(id),
      })
    },
  })
}

