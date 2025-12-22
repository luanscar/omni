import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { queryKeys } from '@/lib/query/keys'
import { getToken } from '@/hooks/use-auth'
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

      const token = getToken()
      const response = await api.post<Media>(
        `/storage/upload?category=${category}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      )
      return response.data
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

      const token = getToken()
      const response = await api.post<Media[]>(
        `/storage/upload/batch?category=${category}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.storage.all() })
    },
  })
}

export function useDeleteFile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.delete(`/storage/${id}`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.storage.all() })
      queryClient.invalidateQueries({
        queryKey: queryKeys.storage.detail(id),
      })
    },
  })
}

