'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useConversations } from '@/lib/api/modules/conversations'
import { useForwardMessage } from '@/lib/api/modules/messages'
import { Search, Loader2, Send } from 'lucide-react'
import { ConversationStatus } from '@/lib/api/types'
import { Checkbox } from '@/components/ui/checkbox'

interface ForwardMessageDialogProps {
  messageId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ForwardMessageDialog({
  messageId,
  open,
  onOpenChange,
}: ForwardMessageDialogProps) {
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const { data: conversations, isLoading } = useConversations({ 
      status: ConversationStatus.OPEN, // Only show open conversations? Or all? Let's show OPEN for now
      search 
  })
  
  const { mutate: forwardMessage, isPending } = useForwardMessage()

  const handleToggle = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    )
  }

  const handleForward = () => {
    if (selectedIds.length === 0) return

    forwardMessage({
      messageId,
      targetConversationIds: selectedIds
    }, {
      onSuccess: () => {
        onOpenChange(false)
        setSelectedIds([])
        setSearch('')
        // TODO: Toast success
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md h-[500px] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 pb-2 border-b">
          <DialogTitle>Encaminhar mensagem</DialogTitle>
          <div className="relative mt-2">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar conversa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 p-2">
          {isLoading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {conversations?.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground p-4">
                  Nenhuma conversa encontrada.
                </div>
              ) : (
                conversations?.map(conversation => (
                  <div
                    key={conversation.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent cursor-pointer"
                    onClick={() => handleToggle(conversation.id)}
                  >
                    <Checkbox 
                      checked={selectedIds.includes(conversation.id)}
                      onCheckedChange={() => handleToggle(conversation.id)}
                    />
                    
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={conversation.contact?.profilePicUrl || ''} />
                      <AvatarFallback>{conversation.contact?.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {conversation.contact?.name || conversation.remoteJid}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {conversation.channel?.name}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="p-4 pt-2 border-t">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button 
            onClick={handleForward} 
            disabled={selectedIds.length === 0 || isPending}
            className="gap-2"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Encaminhar {selectedIds.length > 0 && `(${selectedIds.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
