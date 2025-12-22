'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useContacts } from '@/lib/api/modules/contacts'
import { Search, Loader2, User } from 'lucide-react'
import { Contact } from '@/lib/api/modules/contacts/types'

interface ContactSelectorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (contact: Contact) => void
}

export function ContactSelectorDialog({
  open,
  onOpenChange,
  onSelect,
}: ContactSelectorDialogProps) {
  const [search, setSearch] = useState('')
  const { data: contacts, isLoading } = useContacts()

  const filteredContacts = contacts?.filter(contact => 
    contact.name.toLowerCase().includes(search.toLowerCase()) ||
    contact.phoneNumber?.includes(search)
  )

  const handleSelect = (contact: Contact) => {
    onSelect(contact)
    onOpenChange(false)
    setSearch('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md h-[500px] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 pb-2 border-b">
          <DialogTitle>Selecionar Contato</DialogTitle>
          <div className="relative mt-2">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar contato..."
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
              {filteredContacts?.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground p-4">
                  Nenhum contato encontrado.
                </div>
              ) : (
                filteredContacts?.map(contact => (
                  <div
                    key={contact.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => handleSelect(contact)}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={contact.profilePicUrl || ''} />
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate text-[15px]">
                        {contact.name}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {contact.phoneNumber || 'Sem número'}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
