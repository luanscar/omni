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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Channel, CreateChannelDto, UpdateChannelDto } from '@/lib/api/modules/channels'
import { ChannelType } from '@/lib/api/types'

interface ChannelFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  channel?: Channel | null
  onSubmit: (data: CreateChannelDto | UpdateChannelDto) => Promise<void>
  isLoading?: boolean
}

export function ChannelForm({
  open,
  onOpenChange,
  channel,
  onSubmit,
  isLoading = false,
}: ChannelFormProps) {
  const [name, setName] = useState('')
  const [type, setType] = useState<ChannelType>(ChannelType.WHATSAPP)
  const [identifier, setIdentifier] = useState('')
  const [token, setToken] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      if (channel) {
        setName(channel.name || '')
        setType(channel.type)
        setIdentifier(channel.identifier || '')
        setToken('') // Não mostrar token por segurança
      } else {
        setName('')
        setType(ChannelType.WHATSAPP)
        setIdentifier('')
        setToken('')
      }
      setError(null)
    }
  }, [channel, open])

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
        type,
        identifier: identifier.trim() || undefined,
        token: token.trim() || undefined,
      })
      onOpenChange(false)
    } catch (err: unknown) {
      let errorMessage = 'Erro ao salvar canal. Tente novamente.'

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
              {channel ? 'Editar Canal' : 'Novo Canal'}
            </DialogTitle>
            <DialogDescription>
              {channel
                ? 'Atualize as informações do canal'
                : 'Configure um novo canal de comunicação'}
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
                  placeholder="WhatsApp Vendas"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="type">
                  Tipo <span className="text-destructive">*</span>
                </FieldLabel>
                <Select
                  value={type}
                  onValueChange={(value) => setType(value as ChannelType)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ChannelType.WHATSAPP}>WhatsApp</SelectItem>
                    <SelectItem value={ChannelType.INSTAGRAM}>Instagram</SelectItem>
                    <SelectItem value={ChannelType.TELEGRAM}>Telegram</SelectItem>
                    <SelectItem value={ChannelType.WEBCHAT}>WebChat</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="identifier">Identificador</FieldLabel>
                <Input
                  id="identifier"
                  type="text"
                  placeholder={
                    type === ChannelType.WHATSAPP
                      ? '5511999999999'
                      : type === ChannelType.INSTAGRAM
                        ? 'ID da página'
                        : 'ID ou username'
                  }
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  disabled={isLoading}
                />
                <FieldDescription>
                  {type === ChannelType.WHATSAPP
                    ? 'Número de telefone (será preenchido automaticamente ao conectar)'
                    : 'Identificador do canal na plataforma'}
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="token">Token/Chave API</FieldLabel>
                <Input
                  id="token"
                  type="password"
                  placeholder="Token de autenticação (opcional)"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  disabled={isLoading}
                />
                <FieldDescription>
                  Token de API externa (Meta Cloud API, Telegram Bot Token, etc.)
                </FieldDescription>
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
              {isLoading ? 'Salvando...' : channel ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

