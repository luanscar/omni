import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { queryKeys } from '@/lib/query/keys'

export function useStartWhatsAppSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (channelId: string) =>
      apiClient.post(`/whatsapp/${channelId}/start`),
    onSuccess: (_, channelId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.whatsapp.status(channelId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.whatsapp.qr(channelId),
      })
    },
  })
}

export function useLogoutWhatsApp() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (channelId: string) =>
      apiClient.post(`/whatsapp/${channelId}/logout`),
    onSuccess: (_, channelId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.whatsapp.status(channelId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.whatsapp.qr(channelId),
      })
    },
  })
}

