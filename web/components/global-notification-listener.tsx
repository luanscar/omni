'use client'

import { useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { useSocket, useSocketEvent } from '@/hooks/use-socket'
import { useNotificationSoundStore } from '@/lib/store/notification-sound'
import { useUnreadMessagesStore } from '@/lib/store/unread-messages'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query/keys'
import { apiClient } from '@/lib/api/client'
import type { Message } from '@/lib/api/modules/messages/types'
import type { Conversation } from '@/lib/api/modules/conversations/types'

/**
 * Componente global que escuta eventos de socket para tocar som de notificação
 * e atualizar queries. Deve ser renderizado no layout principal.
 */
export function GlobalNotificationListener() {
  const pathname = usePathname()
  const queryClient = useQueryClient()
  const { isConnected: socketConnected } = useSocket()
  const playSound = useNotificationSoundStore((state) => state.playSound)
  const setActiveConversationId = useNotificationSoundStore((state) => state.setActiveConversationId)

  // Atualizar conversa ativa baseado no pathname
  useEffect(() => {
    // Extrair conversationId do pathname: /dashboard/conversations/[id]
    const conversationId = pathname.startsWith('/dashboard/conversations/') 
      ? pathname.split('/').pop() || null
      : null
    
    // Só atualizar se for realmente um ID de conversa (não 'conversations')
    if (conversationId && conversationId !== 'conversations') {
      setActiveConversationId(conversationId)
    } else {
      setActiveConversationId(null)
    }
  }, [pathname, setActiveConversationId])

  // Função para atualizar o contador de mensagens não lidas
  const updateUnreadCount = useCallback(() => {
    // Buscar todas as queries de conversas do cache
    const allQueries = queryClient.getQueryCache().getAll()
    const conversationQueries = allQueries.filter(
      (query) => query.queryKey[0] === 'conversations' && query.queryKey[1] === 'list'
    )

    // Coletar todas as conversas de todas as queries
    const allConversations: Conversation[] = []
    conversationQueries.forEach((query) => {
      const data = query.state.data as Conversation[] | undefined
      if (data && Array.isArray(data)) {
        allConversations.push(...data)
      }
    })

    // Se não encontrou no cache, tentar buscar da query padrão (sem filtros)
    if (allConversations.length === 0) {
      const defaultQuery = queryClient.getQueryData<Conversation[]>(
        queryKeys.conversations.list({})
      )
      if (defaultQuery) {
        allConversations.push(...defaultQuery)
      }
    }

    // Atualizar store com as conversas encontradas
    if (allConversations.length > 0) {
      useUnreadMessagesStore.getState().setConversations(allConversations)
    }
  }, [queryClient])

  // Buscar conversas e atualizar contador ao montar e quando socket conectar
  useEffect(() => {
    const fetchAndUpdateCount = async () => {
      try {
        // Sempre buscar da API para garantir dados atualizados
        const conversations = await apiClient.get<Conversation[]>('/conversations')
        if (conversations && Array.isArray(conversations)) {
          // Atualizar cache
          queryClient.setQueryData(queryKeys.conversations.list({}), conversations)
          // Atualizar contador
          useUnreadMessagesStore.getState().setConversations(conversations)
        }
      } catch (error) {
        console.warn('Erro ao buscar conversas para atualizar contador:', error)
        // Se falhar, tentar usar dados do cache
        updateUnreadCount()
      }
    }

    // Buscar ao montar
    fetchAndUpdateCount()

    // Observar mudanças nas queries de conversas
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (
        event?.query?.queryKey?.[0] === 'conversations' &&
        event?.query?.queryKey?.[1] === 'list' &&
        event?.type === 'updated'
      ) {
        // Delay para garantir que os dados foram atualizados
        setTimeout(() => {
          const data = event.query.state.data as Conversation[] | undefined
          if (data && Array.isArray(data)) {
            useUnreadMessagesStore.getState().setConversations(data)
          }
        }, 100)
      }
    })

    return unsubscribe
  }, [queryClient, updateUnreadCount, socketConnected])

  // Escutar evento de nova mensagem globalmente
  useSocketEvent<Message>('new-message', (message) => {
    console.log('[GlobalNotificationListener] Nova mensagem recebida:', message)

    // Tocar som primeiro (antes de invalidar queries)
    if (message.conversationId) {
      playSound(message.conversationId)
    }

    // Invalidar e refetch queries relacionadas
    if (message.conversationId) {
      queryClient.invalidateQueries({
        queryKey: queryKeys.messages.byConversation(message.conversationId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversations.detail(message.conversationId),
      })
    }

    // Refetch conversas para atualizar o contador
    queryClient
      .refetchQueries({
        queryKey: queryKeys.conversations.all(),
      })
      .then(() => {
        // Atualizar contador após refetch
        setTimeout(updateUnreadCount, 100)
      })
      .catch((error) => {
        console.warn('Erro ao refetch conversas:', error)
        // Tentar atualizar mesmo assim
        setTimeout(updateUnreadCount, 200)
      })
  })

  // Escutar evento de mensagens marcadas como lidas
  useSocketEvent('messages-read', () => {
    console.log('[GlobalNotificationListener] Mensagens marcadas como lidas')

    // Refetch conversas para atualizar o contador
    queryClient
      .refetchQueries({
        queryKey: queryKeys.conversations.all(),
      })
      .then(() => {
        // Atualizar contador após refetch
        setTimeout(updateUnreadCount, 100)
      })
      .catch((error) => {
        console.warn('Erro ao refetch conversas:', error)
        // Tentar atualizar mesmo assim
        setTimeout(updateUnreadCount, 200)
      })
  })

  // Componente não renderiza nada, apenas escuta eventos
  return null
}
