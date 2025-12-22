import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { queryKeys } from '@/lib/query/keys'
import type { WhatsAppStatus } from './types'

export function useWhatsAppStatus(
  channelId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.whatsapp.status(channelId),
    queryFn: () =>
      apiClient.get<WhatsAppStatus>(`/whatsapp/${channelId}/status`),
    enabled: !!channelId && (options?.enabled !== false),
    refetchInterval: (query) => {
      const data = query.state.data
      // Se não estiver conectado, refetch a cada 5 segundos
      // Se estiver conectado, refetch a cada 30 segundos para verificar se ainda está conectado
      return data?.connected ? 30000 : 5000
    },
    // Refetch quando a janela recebe foco novamente
    refetchOnWindowFocus: true,
  })
}

export function useWhatsAppQr(channelId: string) {
  return useQuery({
    queryKey: queryKeys.whatsapp.qr(channelId),
    queryFn: async () => {
      if (typeof window === 'undefined') {
        throw new Error('QR Code só pode ser obtido no cliente')
      }
      const token = localStorage.getItem('auth_token')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${apiUrl}/whatsapp/${channelId}/qr`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) throw new Error('QR Code não disponível')
      return response.blob()
    },
    enabled: !!channelId && typeof window !== 'undefined',
    refetchInterval: 5000, // Refetch a cada 5 segundos enquanto não conectado
  })
}

