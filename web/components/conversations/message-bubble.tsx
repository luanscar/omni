'use client'

import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ChevronDown, Reply, Forward, Smile, FileText, Download } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu'
import { MessageSenderType, MessageType } from '@/lib/api/types'
import { Message } from '@/lib/api/modules/messages'
import { ForwardMessageDialog } from './forward-message-dialog'
import { AuthenticatedMedia } from './authenticated-media'
import { useCreateMessage } from '@/lib/api/modules/messages'
import { useState } from 'react'
import { api } from '@/lib/api/client'
import Link from 'next/link'

interface MessageBubbleProps {
  message: Message
  onReply?: () => void
}

export function MessageBubble({ message, onReply }: MessageBubbleProps) {
  const isSent = message.senderType === MessageSenderType.USER || message.senderType === MessageSenderType.SYSTEM
  const [forwardOpen, setForwardOpen] = useState(false)
  const { mutate: sendMessage } = useCreateMessage()

  const handleReaction = (emoji: string) => {
    sendMessage({
      conversationId: message.conversationId,
      type: MessageType.REACTION,
      content: '',
      reaction: {
        text: emoji,
        key: message.id
      }
    })
  }

  const handleDownloadDocument = async () => {
    if (!message.media) return

    try {
      const { data } = await api.get(`/storage/${message.media.id}/download?download=true`)
      if (data.url) {
        const link = document.createElement('a')
        link.href = data.url
        link.setAttribute('download', data.originalName || 'download')
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (error) {
      console.error('Erro ao baixar documento:', error)
    }
  }

  const renderMediaContent = () => {
    const media = message.media
    if (!media) return null

    switch (message.type) {
      case MessageType.IMAGE:
        return (
          <div className="mb-2 rounded-lg overflow-hidden max-w-md">
            <Link 
              href={`/dashboard/conversations/${message.conversationId}/media/${media.id}?type=image&mimeType=${encodeURIComponent(media.mimeType)}`}
              scroll={false}
            >
              <AuthenticatedMedia
                mediaId={media.id}
                mimeType={media.mimeType}
                type="image"
                alt={media.originalName || 'Imagem'}
                className="w-full h-auto cursor-pointer hover:opacity-90 transition"
              />
            </Link>
            {message.content && (
              <div className="text-sm mt-1">{message.content}</div>
            )}
          </div>
        )

      case MessageType.VIDEO:
        return (
          <div className="mb-2 rounded-lg overflow-hidden max-w-md">
            <Link 
              href={`/dashboard/conversations/${message.conversationId}/media/${media.id}?type=video&mimeType=${encodeURIComponent(media.mimeType)}`}
              scroll={false}
            >
              <AuthenticatedMedia
                mediaId={media.id}
                mimeType={media.mimeType}
                type="video"
                className="w-full h-auto min-w-[250px]"
              />
            </Link>
            {message.content && (
              <div className="text-sm mt-1">{message.content}</div>
            )}
          </div>
        )

      case MessageType.AUDIO:
        return (
          <div className="mb-2">
            <AuthenticatedMedia
              mediaId={media.id}
              mimeType={media.mimeType}
              type="audio"
              className="max-w-sm"
            />
          </div>
        )

      case MessageType.DOCUMENT:
        const isImage = 
          media.mimeType.startsWith('image/') || 
          /\.(jpg|jpeg|png|gif|webp)$/i.test(media.originalName || '')
        
        return (
          <div className="flex flex-col gap-2">
            {isImage && (
              <div className="rounded-lg overflow-hidden max-w-md mb-1 bg-muted/20">
                <Link 
                  href={`/dashboard/conversations/${message.conversationId}/media/${media.id}?type=image&mimeType=${encodeURIComponent(media.mimeType)}`}
                  scroll={false}
                >
                  <AuthenticatedMedia
                    mediaId={media.id}
                    mimeType={media.mimeType}
                    type="image"
                    alt={media.originalName || 'Imagem'}
                    className="w-full h-auto cursor-pointer hover:opacity-90 transition min-h-[100px] object-cover"
                  />
                </Link>
              </div>
            )}
            <button
              onClick={handleDownloadDocument}
              className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg hover:bg-muted transition max-w-sm w-full text-left"
            >
              <FileText className="h-8 w-8 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{media.originalName}</div>
                <div className="text-xs text-muted-foreground">
                  {media.size ? `${(media.size / 1024).toFixed(1)} KB` : 'Documento'}
                </div>
              </div>
              <Download className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </button>
          </div>
        )

      default:
        return null
    }
  }

  const renderQuotedMessage = () => {
    const quoted = message.quotedMessage
    if (!quoted) return null

    const senderName = quoted.senderType === 'USER' || quoted.senderType === 'SYSTEM'
      ? 'Você'
      : (quoted.senderContact?.name || quoted.senderContact?.phoneNumber || 'Contato')

    return (
      <div className="mb-1 rounded bg-black/5 dark:bg-black/20 border-l-[4px] border-[#06cf9c] overflow-hidden cursor-pointer hover:bg-black/10 dark:hover:bg-black/30 transition-colors">
        <div className="px-2 py-1 flex flex-col min-w-0">
          <span className="text-[12px] font-bold text-[#06cf9c] truncate">
            {senderName}
          </span>
          <div className="text-[13px] text-muted-foreground line-clamp-2 leading-snug">
            {quoted.type === MessageType.TEXT ? quoted.content : (
              <span className="italic flex items-center gap-1">
                {quoted.type.toLowerCase()}
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderReactions = () => {
    const reactions = (message.metadata as any)?.reactions
    if (!reactions || Object.keys(reactions).length === 0) return null

    const emojis = Object.values(reactions) as string[]
    const uniqueEmojis = Array.from(new Set(emojis))

    return (
      <div className={cn(
        "absolute -bottom-3 flex items-center gap-0.5 bg-background dark:bg-[#202c33] border border-black/5 dark:border-white/10 shadow-sm rounded-full px-1 py-0.5 select-none animate-in zoom-in-50 duration-200 z-10",
        isSent ? "right-2" : "left-2"
      )}>
        <div className="flex -space-x-1">
          {uniqueEmojis.slice(0, 3).map((emoji, i) => (
            <span key={i} className="text-[14px] leading-none">{emoji}</span>
          ))}
        </div>
        {emojis.length > 1 && (
          <span className="text-[11px] font-semibold px-0.5 text-muted-foreground">
            {emojis.length}
          </span>
        )}
      </div>
    )
  }
  
  return (
    <>
      <div className={cn("group flex w-full mb-2", isSent ? "justify-end" : "justify-start")}>
        <div
            className={cn(
            "relative max-w-[92%] md:max-w-[85%] rounded-lg text-[14.2px] shadow-sm flex flex-col",
            isSent
                ? "bg-[#d9fdd3] text-foreground rounded-tr-none"
                : "bg-background text-foreground rounded-tl-none border"
            )}
        >
            {/* Conteúdo da Mensagem */}
            <div className="px-3.5 pt-2 pb-1.5 relative pr-10">
                {!isSent && (
                    <div className="text-[12px] font-bold opacity-90 mb-0.5 text-[#e542a3] line-clamp-1">
                        {message.senderContact?.name || message.senderContact?.phoneNumber}
                    </div>
                )}

                {/* Renderizar Mensagem Citada (Reply) */}
                {renderQuotedMessage()}

                {/* Renderizar mídia se existir */}
                {renderMediaContent()}

                {/* Mostrar reações se existirem */}
                {renderReactions()}

                {/* Mostrar texto apenas se não for mídia pura (ou se tiver legenda) */}
                {message.type === MessageType.TEXT && message.content && (
                  <div className="whitespace-pre-wrap break-words text-[14.2px] leading-relaxed">
                    {message.content}
                  </div>
                )}
                
                {/* Metadados (Hora e Status) */}
                <div className="flex items-center justify-end gap-1 mt-1 select-none float-right relative top-[4px] ml-2">
                <span className="text-[11px] text-muted-foreground">
                    {format(new Date(message.createdAt), 'HH:mm')}
                </span>
                {isSent && (
                    <span className={cn(
                        "text-[16px]", 
                        message.status === 'READ' ? "text-blue-500" : "text-muted-foreground"
                    )}>
                    {message.status === 'READ' || message.status === 'DELIVERED' ? '✓✓' : '✓'}
                    </span>
                )}
                </div>
            </div>

            {/* Botão de Ações (Hover) */}
            <div className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-l from-inherit to-transparent rounded-tr-lg">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="p-1 hover:bg-black/5 rounded-full">
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isSent ? "end" : "start"}>
                    <DropdownMenuItem 
                        className="gap-2 cursor-pointer"
                        onClick={onReply}
                    >
                        <Reply className="h-4 w-4" /> Responder
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                        className="gap-2 cursor-pointer"
                        onClick={() => setForwardOpen(true)}
                    >
                        <Forward className="h-4 w-4" /> Encaminhar
                    </DropdownMenuItem>
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="gap-2 cursor-pointer">
                            <Smile className="h-4 w-4" /> Reagir
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                            <div className="flex gap-2 p-2 text-xl">
                                <button className="hover:scale-125 transition" onClick={() => handleReaction('👍')}>👍</button>
                                <button className="hover:scale-125 transition" onClick={() => handleReaction('❤️')}>❤️</button>
                                <button className="hover:scale-125 transition" onClick={() => handleReaction('😂')}>😂</button>
                                <button className="hover:scale-125 transition" onClick={() => handleReaction('😮')}>😮</button>
                                <button className="hover:scale-125 transition" onClick={() => handleReaction('😢')}>😢</button>
                                <button className="hover:scale-125 transition" onClick={() => handleReaction('🙏')}>🙏</button>
                            </div>
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>
                </DropdownMenuContent>
            </DropdownMenu>
            </div>
        </div>
      </div>

      <ForwardMessageDialog 
        messageId={message.id} 
        open={forwardOpen} 
        onOpenChange={setForwardOpen} 
      />
    </>
  )
}
