'use client'

import React, { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useMessagesByConversation } from '@/lib/api/modules/messages'
import { MessageBubble } from './message-bubble'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { useSocketEvent } from '@/hooks/use-socket'
import { queryKeys } from '@/lib/query/keys'
import { Message } from '@/lib/api/modules/messages/types'
import { cn } from '@/lib/utils'

interface MessageListProps {
  conversationId: string
  onReply?: (message: Message) => void
  disabled?: boolean
}

export function MessageList({ conversationId, onReply, disabled = false }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()
  const shouldScrollRef = useRef(true) // Flag para controlar se deve scrollar

  // Real-time updates
  useSocketEvent<Message>('new-message', (newMessage) => {
    if (newMessage.conversationId === conversationId) {
      queryClient.invalidateQueries({
        queryKey: queryKeys.messages.byConversation(conversationId)
      })
      // Quando chegar nova mensagem, deve scrollar
      shouldScrollRef.current = true
    }
  })

  useSocketEvent<Message>('message-updated', (updatedMessage) => {
    if (updatedMessage.conversationId === conversationId) {
      queryClient.invalidateQueries({
        queryKey: queryKeys.messages.byConversation(conversationId)
      })
    }
  })

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useMessagesByConversation(conversationId)

  // Tratamento dos dados (reverse para mostrar mais antigos no topo quando scrollar)
  // Como é chat, a ordem visual é: antigas em cima, novas em baixo.
  // A API deve retornar as mais recentes na página 1.
  // Então invertemos a ordem das páginas e das mensagens dentro de cada página para renderizar.

  const messages = React.useMemo(() => {
    if (!data) return []
    // Flatten pages: página 1 (recentes) ... página N (antigas)
    // Queremos renderizar: Antigas ... Recentes
    const allMessages = data.pages.flatMap((page) => page.data)
    return [...allMessages].reverse()
  }, [data])

  // Função para scrollar até o final
  const scrollToBottom = () => {
    if (scrollRef.current) {
      // Usar requestAnimationFrame para garantir que o DOM foi atualizado
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
      })
    }
  }

  // Scroll quando conversationId mudar (nova conversa aberta)
  useEffect(() => {
    shouldScrollRef.current = true
  }, [conversationId])

  // Auto-scroll to bottom quando carregar mensagens inicialmente ou quando chegar nova mensagem
  useEffect(() => {
    if (!isLoading && messages.length > 0 && shouldScrollRef.current) {
      // Usar setTimeout para garantir que o DOM foi completamente renderizado
      const timeoutId = setTimeout(() => {
        scrollToBottom()
        shouldScrollRef.current = false // Resetar flag após scrollar
      }, 100)
      
      return () => clearTimeout(timeoutId)
    }
  }, [messages.length, isLoading, conversationId])

  // Detectar quando usuário scrolla manualmente para não auto-scrolar
  const handleScroll = () => {
    if (!scrollRef.current) return
    
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100 // 100px de tolerância
    
    // Se o usuário não está perto do final, não deve auto-scrolar
    shouldScrollRef.current = isNearBottom
  }

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin" /></div>
  }

  return (
    <div
      className={cn(
        "flex-1 overflow-y-auto p-4",
        disabled && "pointer-events-none opacity-50"
      )}
      ref={scrollRef}
      onScroll={handleScroll}
    >
      <div className="max-w-6xl mx-auto space-y-4">
        {hasNextPage && (
          <div className="flex justify-center py-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Carregar mensagens antigas
            </Button>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50 py-12">
            <span className="text-4xl mb-2">💬</span>
            <p>Nenhuma mensagem ainda.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} onReply={() => onReply?.(msg)} />
          ))
        )}
      </div>
    </div>
  )
}
