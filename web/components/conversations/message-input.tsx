'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Send, Paperclip, Mic, Smile, Trash2, Check, X, Loader2, FileText, Signature, Image as ImageIcon, Camera, Headphones, User2, BarChart3, Calendar, PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useCreateMessage } from '@/lib/api/modules/messages'
import { useUploadFile, useUploadBatchFiles } from '@/lib/api/modules/storage/mutations'
import { MessageType } from '@/lib/api/types'
import { useAudioRecorder } from '@/hooks/use-audio-recorder'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import EmojiPicker, { Theme, EmojiStyle } from 'emoji-picker-react'
import { cn } from '@/lib/utils'
import { Message } from '@/lib/api/modules/messages/types'
import { ContactSelectorDialog } from './contact-selector-dialog'
import { Contact } from '@/lib/api/modules/contacts/types'

interface MessageInputProps {
  conversationId: string
  replyTo?: Message | null
  onCancelReply?: () => void
}

export function MessageInput({ conversationId, replyTo, onCancelReply }: MessageInputProps) {
  const [content, setContent] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingFiles, setPendingFiles] = useState<{ file: File; caption: string }[]>([])
  const [previewIndex, setPreviewIndex] = useState(0)
  const [signMessage, setSignMessage] = useState(false)
  const [contactDialogOpen, setContactDialogOpen] = useState(false)

  const { mutate: sendMessage, isPending } = useCreateMessage()
  const { mutate: uploadFile, isPending: isUploading } = useUploadFile()
  const { mutate: uploadFileBatch, isPending: isUploadingBatch } = useUploadBatchFiles()

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
      replyToId: replyTo?.id,
      signMessage
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
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const newPending = files.map(f => ({ file: f, caption: '' }))
    setPendingFiles(prev => [...prev, ...newPending])

    // Abrir o primeiro se for a primeira carga
    if (pendingFiles.length === 0) {
      setPreviewIndex(0)
    }

    // Limpar input para permitir selecionar o mesmo arquivo novamente
    e.target.value = ''
  }

  const handleBatchSend = async () => {
    if (pendingFiles.length === 0) return

    console.log('[BATCH DEBUG] Iniciando upload de', pendingFiles.length, 'arquivos')

    uploadFileBatch({
      files: pendingFiles.map(p => p.file),
      category: 'chat_media'
    }, {
      onSuccess: (medias) => {
        console.log('[BATCH DEBUG] Upload concluído:', medias)

        // Enviar mensagens sequencialmente
        medias.forEach((media, index) => {
          let type = MessageType.DOCUMENT
          if (media.mimeType.startsWith('image/')) type = MessageType.IMAGE
          if (media.mimeType.startsWith('video/')) type = MessageType.VIDEO
          if (media.mimeType.startsWith('audio/')) type = MessageType.AUDIO

          sendMessage({
            conversationId,
            content: pendingFiles[index]?.caption || '',
            type,
            mediaId: media.id,
            replyToId: replyTo?.id,
            signMessage
          })
        })

        setPendingFiles([])
        setContent('')
        onCancelReply?.()
      },
      onError: (err) => {
        console.error('[BATCH DEBUG] Erro no upload em lote:', err)
      }
    })
  }

  const removePendingFile = (index: number) => {
    setPendingFiles(prev => {
      const next = [...prev]
      next.splice(index, 1)
      return next
    })
    if (previewIndex >= pendingFiles.length - 1) {
      setPreviewIndex(Math.max(0, pendingFiles.length - 2))
    }
  }

  const handleContactsSelect = (contacts: Contact[]) => {
    contacts.forEach(contact => {
      if (!contact.phoneNumber) return

      const cleanPhone = contact.phoneNumber.replace(/\D/g, '')
      const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${contact.name}
N:${contact.name};;;;
TEL;TYPE=CELL;waid=${cleanPhone}:${contact.phoneNumber}
END:VCARD`

      const payload = {
        conversationId,
        type: MessageType.CONTACT,
        contact: {
          displayName: contact.name,
          vcard
        },
        replyToId: replyTo?.id
      }

      console.log('[SEND CONTACT DEBUG] Sending contact message:', payload)
      sendMessage(payload)
    })

    onCancelReply?.()
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
              <DropdownMenuContent align="start" side="top" className="w-[220px] rounded-[16px] p-2 bg-popover text-popover-foreground border shadow-2xl mb-2">
                <DropdownMenuItem className="gap-4 p-3 cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors" onClick={() => fileInputRef.current?.click()}>
                  <div className="flex items-center justify-center h-5 w-5 text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <span className="text-[15px]">Documento</span>
                </DropdownMenuItem>

                <DropdownMenuItem className="gap-4 p-3 cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors" onClick={() => fileInputRef.current?.click()}>
                  <div className="flex items-center justify-center h-5 w-5 text-primary">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                  <span className="text-[15px]">Fotos e vídeos</span>
                </DropdownMenuItem>

                <DropdownMenuItem className="gap-4 p-3 cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors">
                  <div className="flex items-center justify-center h-5 w-5 text-primary">
                    <Camera className="h-5 w-5" />
                  </div>
                  <span className="text-[15px]">Câmera</span>
                </DropdownMenuItem>

                <DropdownMenuItem className="gap-4 p-3 cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors">
                  <div className="flex items-center justify-center h-5 w-5 text-primary">
                    <Headphones className="h-5 w-5" />
                  </div>
                  <span className="text-[15px]">Áudio</span>
                </DropdownMenuItem>

                <DropdownMenuItem className="gap-4 p-3 cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors" onClick={() => setContactDialogOpen(true)}>
                  <div className="flex items-center justify-center h-5 w-5 text-primary">
                    <User2 className="h-5 w-5" />
                  </div>
                  <span className="text-[15px]">Contato</span>
                </DropdownMenuItem>


              </DropdownMenuContent>
            </DropdownMenu>

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileSelect}
              multiple
            />

            <EmojiPickerButton onEmojiSelect={(emoji) => setContent(prev => prev + emoji)} />

            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-10 w-10 transition-colors rounded-full",
                signMessage ? "text-primary bg-primary/10 hover:bg-primary/20" : "text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5"
              )}
              onClick={() => setSignMessage(!signMessage)}
              title={signMessage ? "Assinatura ativada" : "Assinatura desativada"}
            >
              <Signature className="h-5 w-5" />
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

      {/* Multi-file Preview Overlay */}
      {pendingFiles.length > 0 && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col animate-in fade-in duration-200">
          {/* Top Bar */}
          <div className="flex items-center justify-between p-4">
            <Button variant="ghost" size="icon" onClick={() => setPendingFiles([])} className="text-foreground hover:bg-muted rounded-full">
              <X className="h-6 w-6" />
            </Button>
            <div className="text-foreground text-center">
              <div className="font-semibold">{pendingFiles[previewIndex]?.file.name}</div>
              <div className="text-xs text-muted-foreground">
                {pendingFiles[previewIndex]?.file.type.startsWith('image/') ? 'Imagem' :
                  pendingFiles[previewIndex]?.file.type.startsWith('video/') ? 'Vídeo' : 'Documento'}
              </div>
            </div>
            <div className="w-10" /> {/* Spacer */}
          </div>

          {/* Main Preview */}
          <div className="flex-1 flex items-center justify-center p-4 min-h-0">
            {pendingFiles[previewIndex]?.file.type.startsWith('image/') ? (
              <img
                src={URL.createObjectURL(pendingFiles[previewIndex].file)}
                className="max-h-full max-w-full object-contain"
                alt="Preview"
              />
            ) : pendingFiles[previewIndex]?.file.type.startsWith('video/') ? (
              <video
                src={URL.createObjectURL(pendingFiles[previewIndex].file)}
                className="max-h-full max-w-full"
                controls
              />
            ) : (
              <div className="flex flex-col items-center gap-4 text-foreground">
                <FileText className="h-24 w-24 opacity-20" />
                <span className="text-muted-foreground">{pendingFiles[previewIndex]?.file.name}</span>
              </div>
            )}
          </div>

          {/* Bottom Caption & Thumbnails */}
          <div className="bg-muted/30 p-4 flex flex-col gap-4 border-t">
            {/* Caption Input */}
            <div className="max-w-4xl mx-auto w-full bg-background rounded-lg flex items-center px-4 py-2 border">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-10 w-10 transition-colors rounded-full shrink-0",
                  signMessage ? "text-primary bg-primary/20 hover:bg-primary/30" : "text-white/70 hover:bg-white/10"
                )}
                onClick={() => setSignMessage(!signMessage)}
                title={signMessage ? "Assinatura ativada" : "Assinatura desativada"}
              >
                <Signature className="h-5 w-5" />
              </Button>

              <input
                className="flex-1 bg-transparent border-none focus:ring-0 text-foreground placeholder:text-muted-foreground mr-2"
                placeholder="Digite uma mensagem"
                value={pendingFiles[previewIndex]?.caption || ''}
                onChange={(e) => {
                  const val = e.target.value
                  setPendingFiles(prev => {
                    const next = [...prev]
                    next[previewIndex] = { ...next[previewIndex], caption: val }
                    return next
                  })
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleBatchSend()
                  }
                }}
              />
              <EmojiPickerButton onEmojiSelect={(emoji) => {
                setPendingFiles(prev => {
                  const next = [...prev]
                  next[previewIndex] = { ...next[previewIndex], caption: next[previewIndex].caption + emoji }
                  return next
                })
              }} />
            </div>

            {/* Thumbnails Row */}
            <div className="flex items-center justify-center gap-2 overflow-x-auto py-2">
              {pendingFiles.map((item, i) => (
                <div
                  key={i}
                  className={cn(
                    "relative w-14 h-14 rounded-md overflow-hidden border-2 cursor-pointer shrink-0 transition-all",
                    previewIndex === i ? "border-primary scale-110" : "border-transparent opacity-60 hover:opacity-100"
                  )}
                  onClick={() => setPreviewIndex(i)}
                >
                  {item.file.type.startsWith('image/') ? (
                    <img src={URL.createObjectURL(item.file)} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <FileText className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <button
                    className="absolute top-0 right-0 bg-black/50 text-white rounded-bl-md p-0.5 hover:bg-black/80"
                    onClick={(e) => {
                      e.stopPropagation()
                      removePendingFile(i)
                    }}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}

              <button
                className="w-14 h-14 rounded-md border-2 border-dashed border-input flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-all shrink-0"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="h-6 w-6" />
              </button>
            </div>

            {/* Send Button */}
            <div className="flex justify-end max-w-6xl mx-auto w-full">
              <Button
                className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg relative"
                onClick={handleBatchSend}
                disabled={isPending || isUploadingBatch}
              >
                {isUploadingBatch ? <Loader2 className="animate-spin" /> : <Send className="h-6 w-6 ml-1" />}
                <div className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-background">
                  {pendingFiles.length}
                </div>
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Contact Selector Dialog */}
      <ContactSelectorDialog
        open={contactDialogOpen}
        onOpenChange={setContactDialogOpen}
        onSelect={handleContactsSelect}
      />
    </div>
  )
}

function EmojiPickerButton({ className, onEmojiSelect }: { className?: string; onEmojiSelect: (emoji: string) => void }) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 rounded-full h-10 w-10", className)}
        >
          <Smile className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="p-0 border-none bg-transparent shadow-none w-auto mb-2">
        <EmojiPicker
          theme={Theme.AUTO}
          emojiStyle={EmojiStyle.NATIVE}
          onEmojiClick={(emojiData) => {
            onEmojiSelect(emojiData.emoji)
            // setOpen(false) // Descomente se quiser fechar após escolher um emoji
          }}
          lazyLoadEmojis={true}
          skinTonesDisabled={true}
          searchPlaceholder="Pesquisar emoji..."
        />
      </PopoverContent>
    </Popover>
  )
}
