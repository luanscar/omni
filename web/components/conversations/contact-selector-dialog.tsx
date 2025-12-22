'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { useContacts } from '@/lib/api/modules/contacts'
import { Search, Loader2, User, Send } from 'lucide-react'
import { Contact } from '@/lib/api/modules/contacts/types'

interface ContactSelectorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (contacts: Contact[]) => void
}

export function ContactSelectorDialog({
  open,
  onOpenChange,
  onSelect,
}: ContactSelectorDialogProps) {
  const [search, setSearch] = useState('')
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([])
  const { data: contacts, isLoading } = useContacts()

  const filteredContacts = contacts?.filter(contact =>
    contact.name.toLowerCase().includes(search.toLowerCase()) ||
    contact.phoneNumber?.includes(search)
  )

  const toggleContact = (contact: Contact) => {
    setSelectedContacts(prev => {
      const isSelected = prev.find(c => c.id === contact.id)
      if (isSelected) {
        return prev.filter(c => c.id !== contact.id)
      }
      return [...prev, contact]
    })
  }

  const handleSend = () => {
    if (selectedContacts.length === 0) return
    onSelect(selectedContacts)
    onOpenChange(false)
    setSelectedContacts([])
    setSearch('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md h-[600px] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2 border-b">
          <DialogTitle>Enviar contatos</DialogTitle>
          <div className="relative mt-2">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 bg-muted/50 border-none focus-visible:ring-1"
            />
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full bg-background/50">
            {isLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="flex flex-col pb-2">
                {filteredContacts?.length === 0 ? (
                  <div className="text-center text-sm text-muted-foreground p-8">
                    Nenhum contato encontrado.
                  </div>
                ) : (
                  filteredContacts?.map(contact => (
                    <div
                      key={contact.id}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50 cursor-pointer transition-colors border-b border-border/40 last:border-0"
                      onClick={() => toggleContact(contact)}
                    >
                      <Checkbox
                        checked={!!selectedContacts.find(c => c.id === contact.id)}
                        onCheckedChange={() => toggleContact(contact)}
                        className="rounded-full"
                      />

                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage src={contact.profilePicUrl || ''} />
                        <AvatarFallback className="bg-primary/10 text-primary">
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
        </div>

        <DialogFooter className="p-3 border-t bg-muted/20 flex items-center justify-between sm:justify-between">
          <div className="text-xs text-muted-foreground pl-1">
            {selectedContacts.length} selecionado(s)
          </div>
          <Button
            onClick={handleSend}
            disabled={selectedContacts.length === 0}
            className="rounded-full h-11 w-11 p-0 shadow-lg"
          >
            <Send className="h-5 w-5 ml-0.5" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
