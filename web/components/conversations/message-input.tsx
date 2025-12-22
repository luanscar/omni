'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Send, Paperclip, Mic, Smile, Trash2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useCreateMessage } from '@/lib/api/modules/messages'
import { useUploadFile } from '@/lib/api/modules/storage/mutations'
import { MessageType } from '@/lib/api/types'
import { useAudioRecorder } from '@/hooks/use-audio-recorder'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { Message } from '@/lib/api/modules/messages/types'

interface MessageInputProps {
  conversationId: string
  replyTo?: Message | null
  onCancelReply?: () => void
}

export function MessageInput({ conversationId, replyTo, onCancelReply }: MessageInputProps) {
  const [content, setContent] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const { mutate: sendMessage, isPending } = useCreateMessage()
  const { mutate: uploadFile, isPending: isUploading } = useUploadFile()
  
  const {
      isRecording,
      recordingTime,
      audioBlob,
      startRecording,
      stopRecording,
      cancelRecording,
      resetRecording
  } = useAudioRecorder()

  // Handle successful recording (audioBlob available)
  useEffect(() => {
      if (audioBlob) {
          console.log('[AUDIO DEBUG] Audio blob detectado:', {
              size: audioBlob.size,
              type: audioBlob.type
          })
          
          const file = new File([audioBlob], 'audio-message.webm', { type: 'audio/webm' })
          
          console.log('[AUDIO DEBUG] Iniciando upload do áudio...')
          
          uploadFile({ file, category: 'chat_media' }, {
              onSuccess: (media) => {
                  console.log('[AUDIO DEBUG] Upload concluído, enviando mensagem:', media)
                  sendMessage({
                      conversationId,
                      content: '',
                      type: MessageType.AUDIO,
                      mediaId: media.id,
                      replyToId: replyTo?.id
                  }, {
                      onSuccess: () => {
                          console.log('[AUDIO DEBUG] Mensagem de áudio enviada com sucesso')
                          resetRecording()
                          onCancelReply?.()
                      },
                      onError: (err) => {
                          console.error('[AUDIO DEBUG] Erro ao enviar mensagem de áudio:', err)
                      }
                  })
              },
              onError: (err) => {
                  console.error('[AUDIO DEBUG] Erro ao fazer upload do áudio:', err)
                  resetRecording()
              }
          })
      }
  }, [audioBlob, conversationId, sendMessage, uploadFile, resetRecording, replyTo, onCancelReply])

  // Ajustar altura do textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`
    }
  }, [content])

  const handleSend = () => {
    if (!content.trim()) return

    sendMessage({
      conversationId,
      content: content.trim(),
      type: MessageType.TEXT,
      replyToId: replyTo?.id
    }, {
      onSuccess: () => {
        setContent('')
        onCancelReply?.()
        if (textareaRef.current) textareaRef.current.focus()
      }
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    console.log('[FILE DEBUG] Arquivo selecionado:', {
        name: file.name,
        type: file.type,
        size: file.size
    })

    // Determinar tipo de mensagem baseado no MIME type
    let type = MessageType.DOCUMENT
    if (file.type.startsWith('image/')) type = MessageType.IMAGE
    if (file.type.startsWith('video/')) type = MessageType.VIDEO
    if (file.type.startsWith('audio/')) type = MessageType.AUDIO

    console.log('[FILE DEBUG] Tipo de mensagem determinado:', type)
    console.log('[FILE DEBUG] Iniciando upload...')

    uploadFile(
      { file, category: 'chat_media' },
      {
        onSuccess: (media) => {
          console.log('[FILE DEBUG] Upload concluído, enviando mensagem:', media)
          sendMessage({
            conversationId,
            content: file.name, // Nome do arquivo como legenda/conteúdo padrão
            type,
            mediaId: media.id,
            replyToId: replyTo?.id
          }, {
              onSuccess: () => {
                  console.log('[FILE DEBUG] Mensagem enviada com sucesso')
                  onCancelReply?.()
              },
              onError: (err) => {
                  console.error('[FILE DEBUG] Erro ao enviar mensagem:', err)
              }
          })
        },
        onError: (error) => {
          console.error('[FILE DEBUG] Erro ao fazer upload:', error)
          // TODO: Mostrar toast de erro
        }
      }
    )

    // Limpar input
    e.target.value = ''
  }

  const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (isRecording) {
      return (
          <div className="flex items-center gap-4 p-3 bg-muted/30 border-t min-h-[60px] animate-in fade-in slide-in-from-bottom-2">
              <Button variant="ghost" size="icon" onClick={cancelRecording} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-6 w-6" />
              </Button>
              
              <div className="flex-1 flex items-center justify-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
                  <span className="font-mono text-lg font-medium">{formatTime(recordingTime)}</span>
              </div>
              
              <Button 
                variant="default" 
                size="icon" 
                className="h-10 w-10 rounded-full bg-green-500 hover:bg-green-600 text-white"
                onClick={stopRecording}
              >
                  <Check className="h-5 w-5" />
              </Button>
          </div>
      )
  }

  return (
    <div className="p-2 pb-4 bg-background border-t">
      <div className="max-w-6xl mx-auto bg-muted/30 dark:bg-[#202c33] rounded-[16px] overflow-hidden flex flex-col border shadow-sm">
        {/* Reply Preview */}
        {replyTo && (
          <div className="flex items-center gap-2 p-2 px-4 bg-black/5 dark:bg-black/20 border-b border-black/5 dark:border-white/5 animate-in slide-in-from-bottom-2">
              <div className="flex-1 min-w-0 border-l-[4px] border-[#06cf9c] pl-3 py-1">
                  <div className="text-[13px] font-semibold text-[#06cf9c] truncate">
                      {replyTo.senderType === 'USER' ? 'Você' : (replyTo.senderContact?.name || 'Cliente')}
                  </div>
                  <div className="text-[13px] text-muted-foreground truncate">
                      {replyTo.type === MessageType.TEXT ? replyTo.content : `[${replyTo.type}]`}
                  </div>
              </div>
              <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-muted-foreground hover:bg-transparent -mt-5"
                  onClick={onCancelReply}
              >
                  <X className="h-4 w-4" />
              </Button>
          </div>
        )}

        {/* Action Buttons & Input */}
        <div className="flex items-end gap-1 p-2 min-h-[56px]">
          {/* Botão de Anexo */}
          <div className="flex gap-1 pb-1">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 rounded-full" disabled={isUploading || isPending}>
                        <Paperclip className="h-5 w-5" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" side="top" className="rounded-xl">
                    <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        Fotos e Vídeos
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        Documento
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileSelect}
            />

            <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 rounded-full">
                <Smile className="h-5 w-5" />
            </Button>
          </div>

          {/* Input de Texto */}
          <div className="flex-1 flex items-center min-h-[40px]">
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite uma mensagem"
              className="min-h-[40px] max-h-[150px] w-full resize-none border-0 focus-visible:ring-0 py-2 px-1 bg-transparent text-[15px] leading-normal"
              rows={1}
              disabled={isUploading || isPending}
            />
          </div>

          {/* Botão Enviar / Microfone */}
          <div className="pb-1 px-1">
            {content.trim() ? (
                <Button
                  size="icon"
                  className="h-10 w-10 rounded-full transition-all duration-200 bg-primary hover:bg-primary/90"
                  onClick={handleSend}
                  disabled={isPending || isUploading}
                >
                   <Send className="h-5 w-5 ml-0.5" />
                </Button>
            ) : (
                <Button
                  size="icon"
                  variant="ghost" 
                  className="h-10 w-10 text-muted-foreground rounded-full hover:bg-black/5 dark:hover:bg-white/5"
                  onClick={startRecording}
                  disabled={isPending || isUploading}
                >
                   <Mic className="h-5 w-5" />
                </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
