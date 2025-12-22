'use client'

import { useConversation } from '@/lib/api/modules/conversations'
import { Skeleton } from '@/components/ui/skeleton'
import { MessageList } from './message-list'
import { MessageInput } from './message-input'
import { useState } from 'react'
import { Message } from '@/lib/api/modules/messages/types'

export function ChatArea({ conversationId }: { conversationId: string }) {
  const { data: conversation, isLoading } = useConversation(conversationId)
  const [replyTo, setReplyTo] = useState<Message | null>(null)

  if (isLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-4 p-8">
         <Skeleton className="h-12 w-3/4" />
         <div className="space-y-2 w-full">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
         </div>
      </div>
    )
  }

  if (!conversation) {
    return (
        <div className="flex h-full items-center justify-center text-muted-foreground">
            Conversa não encontrada.
        </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-4 border-b p-4 bg-muted/30">
        <h3 className="font-semibold">{conversation.contact?.name || 'Cliente'}</h3>
      </div>

      {/* Messages */}
      <MessageList 
        conversationId={conversationId} 
        onReply={(msg) => setReplyTo(msg)}
      />

      {/* Input */}
      <MessageInput 
        conversationId={conversationId} 
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />
    </div>
  )
}
