'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useConversations } from '@/lib/api/modules/conversations'
import type { ConversationMessage } from '@/lib/api/modules/conversations/types'
import type { Message } from '@/lib/api/modules/messages/types'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AvatarImageWithStorage } from '@/components/avatar-image'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { format, isToday, isYesterday } from 'date-fns'
import { useQueryClient } from '@tanstack/react-query'
import { useSocketEvent } from '@/hooks/use-socket'
import { useNotificationSound } from '@/hooks/use-notification-sound'
import React from 'react'
import { queryKeys } from '@/lib/query/keys'
import {
  Search,
  Video,
  Phone,
  Image as ImageIcon,
  FileText,
  Check,
  CheckCheck
} from 'lucide-react'

type FilterTab = 'all' | 'unread' | 'groups'

export function ConversationList() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const search = searchParams.get('q') || ''
  // Extrair conversationId do pathname: /dashboard/conversations/[id]
  const activeId = pathname.split('/').pop() !== 'conversations' ? pathname.split('/').pop() : null
  const [activeFilter, setActiveFilter] = React.useState<FilterTab>('all')

  const { data: conversations, isLoading } = useConversations({
    search: search || undefined,
  })

  const queryClient = useQueryClient()
  const { playSound } = useNotificationSound()

  // Atualizar lista quando chegar nova mensagem
  useSocketEvent('new-message', (data: unknown) => {
    const message = data as Message
    queryClient.invalidateQueries({
      queryKey: queryKeys.conversations.all()
    })

    // Tocar som apenas se a mensagem não for da conversa atualmente aberta
    if (message?.conversationId !== activeId) {
      playSound()
    }
  })

  // Atualizar lista quando mensagens forem marcadas como lidas
  useSocketEvent('messages-read', () => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.conversations.all()
    })
  })

  const handleSelect = (id: string) => {
    router.push(`/dashboard/conversations/${id}`)
  }

  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (term) {
      params.set('q', term)
    } else {
      params.delete('q')
    }
    router.replace(`?${params.toString()}`)
  }

  const formatTime = (date: Date) => {
    if (isToday(date)) {
      return format(date, 'HH:mm')
    }
    if (isYesterday(date)) {
      return 'Ontem'
    }
    return format(date, 'dd/MM/yyyy')
  }

  const getMessageIcon = (message: ConversationMessage | null) => {
    if (!message) return null

    if (message.media?.mimeType?.startsWith('video/')) {
      return <Video className="h-4 w-4" />
    }
    if (message.media?.mimeType?.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4" />
    }
    if (message.media?.mimeType?.startsWith('audio/')) {
      return <Phone className="h-4 w-4" />
    }
    if (message.media) {
      return <FileText className="h-4 w-4" />
    }
    return null
  }

  const getMessagePreview = (message: ConversationMessage | null) => {
    if (!message) return 'Iniciar conversa'

    const icon = getMessageIcon(message)
    let text = message.content || ''

    if (message.media?.mimeType?.startsWith('video/')) {
      text = 'Vídeo'
    } else if (message.media?.mimeType?.startsWith('image/')) {
      text = 'Foto'
    } else if (message.media?.mimeType?.startsWith('audio/')) {
      text = 'Ligação de voz'
    } else if (message.media) {
      text = 'Documento'
    }

    return { icon, text }
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Barra de busca */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pergunte à Meta AI ou pesquise"
            defaultValue={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 bg-muted/50 border-0 focus-visible:ring-1"
          />
        </div>
      </div>

      {/* Abas de filtro */}
      <div className="flex gap-2 px-3 py-2 border-b overflow-x-auto">
        <button
          onClick={() => setActiveFilter('all')}
          className={cn(
            "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
            activeFilter === 'all'
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          Tudo
        </button>
        <button
          onClick={() => setActiveFilter('unread')}
          className={cn(
            "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
            activeFilter === 'unread'
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          Não lidas
        </button>
        <button
          onClick={() => setActiveFilter('groups')}
          className={cn(
            "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
            activeFilter === 'groups'
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          Grupos
        </button>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col">
          {isLoading && (
            <div className="p-8 text-center text-muted-foreground text-sm">
              Carregando conversas...
            </div>
          )}

          {!isLoading && (() => {
            // Aplicar filtros
            const filteredConversations = conversations?.filter((conversation) => {
              if (activeFilter === 'all') return true
              if (activeFilter === 'unread') return (conversation.unreadCount ?? 0) > 0
              if (activeFilter === 'groups') return conversation.isGroup === true
              return true
            })

            // Mostrar mensagem se não houver conversas
            if (!filteredConversations || filteredConversations.length === 0) {
              const messages = {
                all: 'Nenhuma conversa encontrada.',
                unread: 'Nenhuma conversa não lida.',
                groups: 'Nenhum grupo encontrado.',
              }

              return (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  {messages[activeFilter]}
                </div>
              )
            }

            // Renderizar lista de conversas
            return filteredConversations.map((conversation) => {
              const contact = conversation.contact
              const lastMessage = conversation.messages?.[0]
              const isActive = activeId === conversation.id
              const messagePreview = getMessagePreview(lastMessage)
              const hasUnread = (conversation.unreadCount ?? 0) > 0

              const statusLabel = {
                PENDING: 'Pendente',
                OPEN: 'Aberta',
                CLOSED: 'Fechada'
              }[conversation.status] || conversation.status

              return (
                <button
                  key={conversation.id}
                  onClick={() => handleSelect(conversation.id)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 text-left transition-all border-b relative",
                    "hover:bg-accent/50",
                    isActive && "bg-accent before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-primary"
                  )}
                >
                  {/* Avatar com indicador de status e tooltip */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="relative">
                          <AvatarImageWithStorage
                            src={contact?.profilePicUrl}
                            alt={contact?.name || 'Contato'}
                            fallback={contact?.name?.slice(0, 2).toUpperCase() || 'C'}
                            className={cn(
                              "h-12 w-12 flex-shrink-0 transition-all cursor-help",
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
                              className="absolute -bottom-1 -right-1 h-7 w-7 border-2 border-background shadow-md"
                            />
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>Status: {statusLabel}</p>
                        {conversation.assignee && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Atribuído: {conversation.assignee.name}
                          </p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {/* Conteúdo da conversa */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={cn(
                        "font-medium text-sm truncate",
                        hasUnread && "font-semibold"
                      )}>
                        {contact?.name || conversation.remoteJid}
                      </h3>
                      <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                        {conversation.updatedAt && formatTime(new Date(conversation.updatedAt))}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className={cn(
                        "flex items-center gap-1.5 text-xs truncate",
                        hasUnread ? "text-foreground font-medium" : "text-muted-foreground"
                      )}>
                        {typeof messagePreview === 'object' && messagePreview.icon && (
                          <span className="flex-shrink-0">{messagePreview.icon}</span>
                        )}
                        {/* ConversationMessage não tem fromMe/status, apenas senderType */}
                        {lastMessage?.senderType === 'USER' && (
                          <span className="flex-shrink-0">
                            <CheckCheck className="h-3 w-3 text-primary" />
                          </span>
                        )}
                        <span className="truncate">
                          {typeof messagePreview === 'object' ? messagePreview.text : messagePreview}
                        </span>
                      </div>

                      {hasUnread && (
                        <Badge className="bg-primary text-primary-foreground h-5 min-w-5 px-1.5 text-[11px] font-medium flex-shrink-0">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              )
            })
          })()}
        </div>
      </ScrollArea>
    </div>
  )
}
