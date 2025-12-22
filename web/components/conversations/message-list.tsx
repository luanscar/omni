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

interface MessageListProps {
  conversationId: string
  onReply?: (message: Message) => void
}

export function MessageList({ conversationId, onReply }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()
  
  // Real-time updates
  useSocketEvent<Message>('new-message', (newMessage) => {
    if (newMessage.conversationId === conversationId) {
      // Opção 1: Invalidar cache (mais simples, garante consistência)
      queryClient.invalidateQueries({
        queryKey: queryKeys.messages.byConversation(conversationId)
      })
      
      // Opção 2 (Otimista): Atualizar cache manualmente (mais complexo com infinite query)
      // Futuro: Implementar atualização otimista se performance for crítica
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

  // Auto-scroll to bottom on initial load via useEffect (pode ser melhorado com layouts específicos de chat)
  useEffect(() => {
      if(!isLoading && messages.length > 0 && scrollRef.current) {
          // Apenas scrolla se estivermos perto do fim ou na carga inicial (simplificado)
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }
  }, [messages.length, isLoading])

  if (isLoading) {
      return <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin" /></div>
  }

  return (
    <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
      <div className="max-w-5xl mx-auto space-y-4">
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
