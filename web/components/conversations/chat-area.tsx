'use client'

import { useConversation, useMarkMessagesAsRead } from '@/lib/api/modules/conversations'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MessageList } from './message-list'
import { MessageInput } from './message-input'
import { AssignAgentDialog } from './assign-agent-dialog'
import { AvatarImageWithStorage } from '@/components/avatar-image'
import { useState, useEffect } from 'react'
import { Message } from '@/lib/api/modules/messages/types'
import { useSocketEvent } from '@/hooks/use-socket'
import { cn } from '@/lib/utils'
import { Search, MoreVertical, UserPlus, X, Archive, Trash2 } from 'lucide-react'

export function ChatArea({ conversationId }: { conversationId: string }) {
  const { data: conversation, isLoading } = useConversation(conversationId)
  const { mutate: markAsRead } = useMarkMessagesAsRead()
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)

  // Marcar mensagens como lidas quando a conversa é aberta
  useEffect(() => {
    if (conversationId) {
      console.log('[ChatArea] Attempting to mark messages as read for:', conversationId)
      markAsRead(conversationId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]) // Removido markAsRead para evitar loops

  // Marcar automaticamente como lida quando chegar nova mensagem com o chat aberto
  useSocketEvent<{ conversationId?: string }>('new-message', (message) => {
    if (message?.conversationId === conversationId) {
      console.log('[ChatArea] New message received in open chat, marking as read')
      markAsRead(conversationId)
    }
  })


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

  const statusLabel = {
    PENDING: 'Pendente',
    OPEN: 'Aberta',
    CLOSED: 'Fechada'
  }[conversation.status] || conversation.status

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b p-3 bg-muted/30">
        {/* Avatar e nome do contato */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative">
                  <AvatarImageWithStorage
                    src={conversation.contact?.profilePicUrl}
                    alt={conversation.contact?.name || 'Contato'}
                    fallback={conversation.contact?.name?.slice(0, 2).toUpperCase() || 'C'}
                    className={cn(
                      "h-10 w-10 flex-shrink-0 transition-all cursor-help",
                      // Ring e shadow baseados no status da conversa
                      conversation.status === 'PENDING' && "ring-2 ring-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.6)]",
                      conversation.status === 'OPEN' && "ring-2 ring-green-500 shadow-[0_0_12px_rgba(34,197,94,0.6)]",
                      conversation.status === 'CLOSED' && "ring-2 ring-red-500 shadow-[0_0_12px_rgba(239,68,68,0.6)]"
                    )}
                  />

                  {/* Mini avatar do agente atribuído */}
                  {conversation.assignee && (
                    <AvatarImageWithStorage
                      src={conversation.assignee.avatarUrl}
                      alt={conversation.assignee.name || 'Agente'}
                      fallback={conversation.assignee.name?.slice(0, 2).toUpperCase() || 'A'}
                      className="absolute -bottom-1 -right-1 h-6 w-6 border-2 border-background shadow-md"
                    />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Status: {statusLabel}</p>
                {conversation.assignee && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Atribuído: {conversation.assignee.name}
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <h3 className="font-semibold truncate">{conversation.contact?.name || 'Cliente'}</h3>
        </div>

        {/* Botões de ação */}
        <div className="flex items-center gap-1">
          {/* Botão Atribuir Agente */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-muted-foreground hover:text-foreground"
                  onClick={() => setAssignDialogOpen(true)}
                >
                  <UserPlus className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Atribuir agente</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Botão Buscar */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
                  <Search className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Buscar na conversa</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Menu de Opções */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>
                <Archive className="h-4 w-4 mr-2" />
                Arquivar conversa
              </DropdownMenuItem>
              <DropdownMenuItem>
                <X className="h-4 w-4 mr-2" />
                Fechar conversa
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir conversa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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

      {/* Dialog de atribuição de agente */}
      <AssignAgentDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        conversationId={conversationId}
        currentAssigneeId={conversation?.assigneeId}
      />
    </div>
  )
}
