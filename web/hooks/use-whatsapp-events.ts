'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useSocketEvent } from './use-socket'
import { queryKeys } from '@/lib/query/keys'

/**
 * Hook para escutar eventos do WhatsApp via WebSocket
 * 
 * @param channelId - ID do canal WhatsApp (opcional, se não fornecido escuta todos os canais)
 * @param options - Opções de configuração
 */
export function useWhatsAppEvents(
  channelId?: string,
  options?: {
    onConnecting?: (data: { channelId: string; timestamp: string }) => void
    onQrCode?: (data: { channelId: string; qrCode: string; timestamp: string }) => void
    onConnected?: (data: { channelId: string; identifier?: string; timestamp: string }) => void
    onDisconnected?: (data: { channelId: string; reason?: string; timestamp: string }) => void
    onReconnecting?: (data: { channelId: string; timestamp: string }) => void
    enabled?: boolean
  }
) {
  const queryClient = useQueryClient()
  const enabled = options?.enabled !== false

  // Evento: WhatsApp está conectando
  useSocketEvent<{ channelId: string; status: string; timestamp: string }>(
    'whatsapp:connecting',
    (data) => {
      if (channelId && data.channelId !== channelId) return
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({
        queryKey: queryKeys.whatsapp.status(data.channelId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.channels.all(),
      })
      
      // Callback customizado
      options?.onConnecting?.(data)
    },
    enabled
  )

  // Evento: QR Code gerado
  useSocketEvent<{
    channelId: string
    qrCode: string
    timestamp: string
  }>(
    'whatsapp:qrcode',
    (data) => {
      if (channelId && data.channelId !== channelId) return
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({
        queryKey: queryKeys.whatsapp.qr(data.channelId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.whatsapp.status(data.channelId),
      })
      
      // Callback customizado
      options?.onQrCode?.(data)
    },
    enabled
  )

  // Evento: WhatsApp conectado
  useSocketEvent<{
    channelId: string
    status: string
    identifier?: string
    timestamp: string
  }>(
    'whatsapp:connected',
    (data) => {
      if (channelId && data.channelId !== channelId) return
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({
        queryKey: queryKeys.whatsapp.status(data.channelId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.channels.all(),
      })
      
      // Callback customizado
      options?.onConnected?.(data)
    },
    enabled
  )

  // Evento: WhatsApp desconectado
  useSocketEvent<{
    channelId: string
    status: string
    reason?: string
    timestamp: string
  }>(
    'whatsapp:disconnected',
    (data) => {
      if (channelId && data.channelId !== channelId) return
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({
        queryKey: queryKeys.whatsapp.status(data.channelId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.channels.all(),
      })
      
      // Callback customizado
      options?.onDisconnected?.(data)
    },
    enabled
  )

  // Evento: WhatsApp reconectando
  useSocketEvent<{
    channelId: string
    status: string
    timestamp: string
  }>(
    'whatsapp:reconnecting',
    (data) => {
      if (channelId && data.channelId !== channelId) return
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({
        queryKey: queryKeys.whatsapp.status(data.channelId),
      })
      
      // Callback customizado
      options?.onReconnecting?.(data)
    },
    enabled
  )
}

