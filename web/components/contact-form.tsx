'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import type { Contact, CreateContactDto, UpdateContactDto } from '@/lib/api/modules/contacts'

interface ContactFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contact?: Contact | null
  onSubmit: (data: CreateContactDto | UpdateContactDto) => Promise<void>
  isLoading?: boolean
}

export function ContactForm({
  open,
  onOpenChange,
  contact,
  onSubmit,
  isLoading = false,
}: ContactFormProps) {
  const [name, setName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [email, setEmail] = useState('')
  const [profilePicUrl, setProfilePicUrl] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (contact) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(contact.name || '')
      setPhoneNumber(contact.phoneNumber || '')
      setEmail(contact.email || '')
      setProfilePicUrl(contact.profilePicUrl || '')
    } else {
      setName('')
      setPhoneNumber('')
      setEmail('')
      setProfilePicUrl('')
    }
    setError(null)
  }, [contact, open])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('O nome é obrigatório')
      return
    }

    try {
      await onSubmit({
        name: name.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
        email: email.trim() || undefined,
        profilePicUrl: profilePicUrl.trim() || undefined,
      })
      onOpenChange(false)
    } catch (err: unknown) {
      let errorMessage = 'Erro ao salvar contato. Tente novamente.'
      
      if (err instanceof Error) {
        if ('response' in err && err.response) {
          const axiosError = err as { response?: { data?: { message?: string } } }
          errorMessage = axiosError.response?.data?.message || errorMessage
        } else {
          errorMessage = err.message
        }
      }
      
      setError(errorMessage)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {contact ? 'Editar Contato' : 'Novo Contato'}
            </DialogTitle>
            <DialogDescription>
              {contact
                ? 'Atualize as informações do contato'
                : 'Preencha os dados para criar um novo contato'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">
                  Nome <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  id="name"
                  type="text"
                  placeholder="João Silva"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="phoneNumber">Telefone</FieldLabel>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="+55 11 99999-9999"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={isLoading}
                />
                <FieldDescription>
                  Formato: +55 11 99999-9999 (E.164)
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="joao@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="profilePicUrl">URL da Foto</FieldLabel>
                <Input
                  id="profilePicUrl"
                  type="url"
                  placeholder="https://exemplo.com/foto.jpg"
                  value={profilePicUrl}
                  onChange={(e) => setProfilePicUrl(e.target.value)}
                  disabled={isLoading}
                />
              </Field>
              {error && (
                <Field>
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                </Field>
              )}
            </FieldGroup>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : contact ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

