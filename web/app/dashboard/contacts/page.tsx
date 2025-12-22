'use client'

import { useState, useMemo } from 'react'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AvatarImageWithStorage } from '@/components/avatar-image'
import { Badge } from '@/components/ui/badge'
import { ContactForm } from '@/components/contact-form'
import {
  useContacts,
  useCreateContact,
  useUpdateContact,
  useDeleteContact,
} from '@/lib/api/modules/contacts'
import type { Contact, CreateContactDto, UpdateContactDto } from '@/lib/api/modules/contacts'
import { Plus, Search, MoreVertical, Edit, Trash2, Phone, Mail } from 'lucide-react'

export default function ContactsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)

  const { data: contacts, isLoading } = useContacts()
  const createContact = useCreateContact()
  const updateContact = useUpdateContact()
  const deleteContact = useDeleteContact()

  // Filtrar contatos pela busca
  const filteredContacts = useMemo(() => {
    if (!contacts) return []
    
    if (!searchQuery.trim()) return contacts

    const query = searchQuery.toLowerCase()
    return contacts.filter(
      (contact) =>
        contact.name.toLowerCase().includes(query) ||
        contact.email?.toLowerCase().includes(query) ||
        contact.phoneNumber?.includes(query)
    )
  }, [contacts, searchQuery])

  const handleCreate = () => {
    setSelectedContact(null)
    setIsFormOpen(true)
  }

  const handleEdit = (contact: Contact) => {
    setSelectedContact(contact)
    setIsFormOpen(true)
  }

  const handleDelete = async (contact: Contact) => {
    if (
      !confirm(
        `Tem certeza que deseja excluir o contato "${contact.name}"? Esta ação não pode ser desfeita.`
      )
    ) {
      return
    }

    try {
      await deleteContact.mutateAsync(contact.id)
    } catch (err: unknown) {
      console.error('Erro ao deletar contato:', err)
      let errorMessage = 'Erro ao deletar contato. Tente novamente.'
      
      if (err instanceof Error) {
        if ('response' in err && err.response) {
          const axiosError = err as { response?: { data?: { message?: string }; status?: number } }
          if (axiosError.response?.status === 403) {
            errorMessage = 'Você não tem permissão para excluir contatos.'
          } else if (axiosError.response?.status === 404) {
            errorMessage = 'Contato não encontrado.'
          } else {
            errorMessage = axiosError.response?.data?.message || errorMessage
          }
        } else if (err.message.includes('Network Error')) {
          errorMessage = 'Erro de conexão. Verifique se a API está rodando.'
        } else {
          errorMessage = err.message
        }
      }
      
      alert(errorMessage)
    }
  }

  const handleSubmit = async (data: CreateContactDto | UpdateContactDto) => {
    if (selectedContact) {
      await updateContact.mutateAsync({
        id: selectedContact.id,
        data: data as UpdateContactDto,
      })
    } else {
      await createContact.mutateAsync(data as CreateContactDto)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatPhone = (phone?: string) => {
    if (!phone) return '-'
    // Formato E.164: +5511999999999
    if (phone.startsWith('+55')) {
      const cleaned = phone.replace(/\D/g, '')
      if (cleaned.length === 13) {
        // +55 11 99999-9999
        return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`
      }
    }
    return phone
  }

  return (
    <>
      <Header />
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Contatos</h1>
              <p className="text-muted-foreground">
                Gerencie seus contatos e clientes
              </p>
            </div>
            <Button onClick={handleCreate} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Novo Contato
            </Button>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por nome, email ou telefone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Carregando contatos...</p>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-lg font-medium text-muted-foreground">
                {searchQuery
                  ? 'Nenhum contato encontrado'
                  : 'Nenhum contato cadastrado'}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {searchQuery
                  ? 'Tente buscar com outros termos'
                  : 'Comece criando seu primeiro contato'}
              </p>
              {!searchQuery && (
                <Button onClick={handleCreate} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Contato
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contato</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Criado em
                    </TableHead>
                    <TableHead className="w-[70px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <AvatarImageWithStorage
                            src={contact.profilePicUrl}
                            alt={contact.name}
                            fallback={getInitials(contact.name)}
                          />
                          <div>
                            <div className="font-medium">{contact.name}</div>
                            {contact.customFields && Object.keys(contact.customFields).length > 0 && (
                              <Badge variant="secondary" className="mt-1 text-xs">
                                Campos customizados
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {contact.phoneNumber ? (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">
                              {formatPhone(contact.phoneNumber)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {contact.email ? (
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{contact.email}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-sm text-muted-foreground">
                          {new Date(contact.createdAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleEdit(contact)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(contact)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Stats */}
          {!isLoading && filteredContacts.length > 0 && (
            <div className="mt-6 text-sm text-muted-foreground">
              Mostrando {filteredContacts.length} de {contacts?.length || 0}{' '}
              contato{filteredContacts.length !== 1 ? 's' : ''}
              {searchQuery && ` para "${searchQuery}"`}
            </div>
          )}
        </div>
      </div>

      {/* Contact Form Dialog */}
      <ContactForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        contact={selectedContact}
        onSubmit={handleSubmit}
        isLoading={
          createContact.isPending || updateContact.isPending
        }
      />
    </>
  )
}

