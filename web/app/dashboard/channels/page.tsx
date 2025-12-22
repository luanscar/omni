'use client'

import { useState } from 'react'
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
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChannelForm } from '@/components/channel-form'
import { WhatsAppQrDialog } from '@/components/whatsapp-qr-dialog'
import {
  useChannels,
  useCreateChannel,
  useUpdateChannel,
  useDeleteChannel,
} from '@/lib/api/modules/channels'
import {
  useStartWhatsAppSession,
  useLogoutWhatsApp,
  useWhatsAppStatus,
} from '@/lib/api/modules/whatsapp'
import { useSocketEvent } from '@/hooks/use-socket'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query/keys'
import type { Channel, CreateChannelDto, UpdateChannelDto } from '@/lib/api/modules/channels'
import { ChannelType } from '@/lib/api/types'
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  QrCode,
  Power,
  PowerOff,
  Smartphone,
  MessageSquare,
  Send,
  Globe,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react'

export default function ChannelsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isQrOpen, setIsQrOpen] = useState(false)
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null)
  const [qrChannelId, setQrChannelId] = useState<string | null>(null)

  const { data: channels, isLoading } = useChannels()
  const createChannel = useCreateChannel()
  const updateChannel = useUpdateChannel()
  const deleteChannel = useDeleteChannel()
  const startWhatsApp = useStartWhatsAppSession()
  const logoutWhatsApp = useLogoutWhatsApp()
  const queryClient = useQueryClient()

  // Escutar eventos de novas mensagens via socket.io
  useSocketEvent('new-message', (message: any) => {
    console.log('Nova mensagem recebida via socket.io:', message)
    // Invalidar queries relacionadas para atualizar a UI
    if (message.conversationId) {
      queryClient.invalidateQueries({
        queryKey: queryKeys.messages.byConversation(message.conversationId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversations.detail(message.conversationId),
      })
    }
    queryClient.invalidateQueries({
      queryKey: queryKeys.conversations.all(),
    })
  })

  // Escutar eventos do WhatsApp - Status da Conexão
  useSocketEvent<{ channelId: string; status: string; timestamp: string }>(
    'whatsapp:connecting',
    (data) => {
      console.log('WhatsApp conectando:', data)
      // Invalidar status do canal para atualizar a UI
      queryClient.invalidateQueries({
        queryKey: queryKeys.whatsapp.status(data.channelId),
      })
      // Invalidar canais para atualizar o estado ativo
      queryClient.invalidateQueries({
        queryKey: queryKeys.channels.all(),
      })
    }
  )

  useSocketEvent<{
    channelId: string
    qrCode: string
    timestamp: string
  }>('whatsapp:qrcode', (data) => {
    console.log('QR Code gerado:', data.channelId)
    // Invalidar QR code e status
    queryClient.invalidateQueries({
      queryKey: queryKeys.whatsapp.qr(data.channelId),
    })
    queryClient.invalidateQueries({
      queryKey: queryKeys.whatsapp.status(data.channelId),
    })
    // Se o QR dialog estiver aberto para este canal, atualizar
    if (qrChannelId === data.channelId && isQrOpen) {
      // O dialog já deve estar escutando, mas invalidamos para garantir
      queryClient.invalidateQueries({
        queryKey: queryKeys.whatsapp.qr(data.channelId),
      })
    }
  })

  useSocketEvent<{
    channelId: string
    status: string
    identifier?: string
    timestamp: string
  }>('whatsapp:connected', (data) => {
    console.log('WhatsApp conectado:', data)
    // Invalidar status e canais para atualizar a UI
    queryClient.invalidateQueries({
      queryKey: queryKeys.whatsapp.status(data.channelId),
    })
    queryClient.invalidateQueries({
      queryKey: queryKeys.channels.all(),
    })
    // Fechar dialog de QR se estiver aberto
    if (qrChannelId === data.channelId) {
      setIsQrOpen(false)
    }
  })

  useSocketEvent<{
    channelId: string
    status: string
    reason?: string
    timestamp: string
  }>('whatsapp:disconnected', (data) => {
    console.log('WhatsApp desconectado:', data)
    // Invalidar status e canais
    queryClient.invalidateQueries({
      queryKey: queryKeys.whatsapp.status(data.channelId),
    })
    queryClient.invalidateQueries({
      queryKey: queryKeys.channels.all(),
    })
  })

  useSocketEvent<{
    channelId: string
    status: string
    timestamp: string
  }>('whatsapp:reconnecting', (data) => {
    console.log('WhatsApp reconectando:', data)
    // Invalidar status para mostrar estado de reconexão
    queryClient.invalidateQueries({
      queryKey: queryKeys.whatsapp.status(data.channelId),
    })
  })

  // Filtrar canais pela busca
  const filteredChannels = channels?.filter(
    (channel) =>
      channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      channel.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      channel.identifier?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  const handleCreate = () => {
    setSelectedChannel(null)
    setIsFormOpen(true)
  }

  const handleEdit = (channel: Channel) => {
    setSelectedChannel(channel)
    setIsFormOpen(true)
  }

  const handleDelete = async (channel: Channel) => {
    if (
      !confirm(
        `Tem certeza que deseja excluir o canal "${channel.name}"? Esta ação não pode ser desfeita.`
      )
    ) {
      return
    }

    try {
      await deleteChannel.mutateAsync(channel.id)
    } catch (err: unknown) {
      console.error('Erro ao deletar canal:', err)
      alert('Erro ao deletar canal. Tente novamente.')
    }
  }

  const handleStartWhatsApp = async (channel: Channel) => {
    try {
      await startWhatsApp.mutateAsync(channel.id)
      setQrChannelId(channel.id)
      setIsQrOpen(true)
    } catch (err: unknown) {
      console.error('Erro ao iniciar WhatsApp:', err)
      alert('Erro ao iniciar sessão do WhatsApp. Tente novamente.')
    }
  }

  const handleLogoutWhatsApp = async (channel: Channel) => {
    if (
      !confirm(
        `Tem certeza que deseja desconectar o WhatsApp do canal "${channel.name}"?`
      )
    ) {
      return
    }

    try {
      await logoutWhatsApp.mutateAsync(channel.id)
    } catch (err: unknown) {
      console.error('Erro ao desconectar WhatsApp:', err)
      alert('Erro ao desconectar WhatsApp. Tente novamente.')
    }
  }

  const handleSubmit = async (data: CreateChannelDto | UpdateChannelDto) => {
    if (selectedChannel) {
      await updateChannel.mutateAsync({
        id: selectedChannel.id,
        data: data as UpdateChannelDto,
      })
    } else {
      await createChannel.mutateAsync(data as CreateChannelDto)
    }
  }

  const getChannelIcon = (type: ChannelType) => {
    switch (type) {
      case ChannelType.WHATSAPP:
        return <MessageSquare className="h-4 w-4" />
      case ChannelType.INSTAGRAM:
        return <Send className="h-4 w-4" />
      case ChannelType.TELEGRAM:
        return <Send className="h-4 w-4" />
      case ChannelType.WEBCHAT:
        return <Globe className="h-4 w-4" />
      default:
        return <Smartphone className="h-4 w-4" />
    }
  }

  const getChannelTypeLabel = (type: ChannelType) => {
    switch (type) {
      case ChannelType.WHATSAPP:
        return 'WhatsApp'
      case ChannelType.INSTAGRAM:
        return 'Instagram'
      case ChannelType.TELEGRAM:
        return 'Telegram'
      case ChannelType.WEBCHAT:
        return 'WebChat'
      default:
        return type
    }
  }

  return (
    <>
      <Header />
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Canais</h1>
              <p className="text-muted-foreground">
                Gerencie seus canais de comunicação
              </p>
            </div>
            <Button onClick={handleCreate} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Novo Canal
            </Button>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por nome, tipo ou identificador..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Channels Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">
                Carregando canais...
              </span>
            </div>
          ) : filteredChannels.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-lg font-medium text-muted-foreground">
                {searchQuery
                  ? 'Nenhum canal encontrado'
                  : 'Nenhum canal cadastrado'}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {searchQuery
                  ? 'Tente buscar com outros termos'
                  : 'Comece criando seu primeiro canal'}
              </p>
              {!searchQuery && (
                <Button onClick={handleCreate} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Canal
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredChannels.map((channel) => (
                <ChannelCard
                  key={channel.id}
                  channel={channel}
                  onEdit={() => handleEdit(channel)}
                  onDelete={() => handleDelete(channel)}
                  onStartWhatsApp={() => handleStartWhatsApp(channel)}
                  onLogoutWhatsApp={() => handleLogoutWhatsApp(channel)}
                  onShowQr={() => {
                    setQrChannelId(channel.id)
                    setIsQrOpen(true)
                  }}
                  getChannelIcon={getChannelIcon}
                  getChannelTypeLabel={getChannelTypeLabel}
                />
              ))}
            </div>
          )}

          {/* Stats */}
          {!isLoading && filteredChannels.length > 0 && (
            <div className="mt-6 text-sm text-muted-foreground">
              Mostrando {filteredChannels.length} de {channels?.length || 0}{' '}
              canal{filteredChannels.length !== 1 ? 'is' : ''}
              {searchQuery && ` para "${searchQuery}"`}
            </div>
          )}
        </div>
      </div>

      {/* Channel Form Dialog */}
      <ChannelForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        channel={selectedChannel}
        onSubmit={handleSubmit}
        isLoading={createChannel.isPending || updateChannel.isPending}
      />

      {/* WhatsApp QR Dialog */}
      {qrChannelId && (
        <WhatsAppQrDialog
          open={isQrOpen}
          onOpenChange={setIsQrOpen}
          channelId={qrChannelId}
          channelName={
            channels?.find((c) => c.id === qrChannelId)?.name || 'Canal'
          }
        />
      )}
    </>
  )
}

interface ChannelCardProps {
  channel: Channel
  onEdit: () => void
  onDelete: () => void
  onStartWhatsApp: () => void
  onLogoutWhatsApp: () => void
  onShowQr: () => void
  getChannelIcon: (type: ChannelType) => React.ReactNode
  getChannelTypeLabel: (type: ChannelType) => string
}

function ChannelCard({
  channel,
  onEdit,
  onDelete,
  onStartWhatsApp,
  onLogoutWhatsApp,
  onShowQr,
  getChannelIcon,
  getChannelTypeLabel,
}: ChannelCardProps) {
  const isWhatsApp = channel.type === ChannelType.WHATSAPP
  const { data: whatsappStatus, isLoading: isLoadingStatus } =
    useWhatsAppStatus(channel.id, { enabled: isWhatsApp })
  const startWhatsApp = useStartWhatsAppSession()
  const logoutWhatsApp = useLogoutWhatsApp()

  // Determinar se está conectado baseado no status do WhatsApp e no estado do canal
  // Prioriza o status do WhatsApp, mas também verifica o estado do canal como fallback
  const isConnected =
    isWhatsApp
      ? (whatsappStatus?.connected === true || (channel.active && channel.identifier))
      : channel.active

  const isLoading = startWhatsApp.isPending || logoutWhatsApp.isPending || isLoadingStatus

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {getChannelIcon(channel.type)}
            <CardTitle className="text-lg">{channel.name}</CardTitle>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              {isWhatsApp && (
                <>
                  <DropdownMenuSeparator />
                  {isConnected ? (
                    <>
                      <DropdownMenuItem onClick={onShowQr}>
                        <QrCode className="mr-2 h-4 w-4" />
                        Ver QR Code
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={onLogoutWhatsApp}
                        className="text-destructive"
                      >
                        <PowerOff className="mr-2 h-4 w-4" />
                        Desconectar
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <DropdownMenuItem onClick={onStartWhatsApp}>
                      <Power className="mr-2 h-4 w-4" />
                      Conectar
                    </DropdownMenuItem>
                  )}
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onDelete}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Tipo</span>
            <Badge variant="secondary">
              {getChannelTypeLabel(channel.type)}
            </Badge>
          </div>
          {channel.identifier && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Identificador
              </span>
              <span className="text-sm font-medium">{channel.identifier}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            {channel.active ? (
              <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>Ativo</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <XCircle className="h-4 w-4" />
                <span>Inativo</span>
              </div>
            )}
          </div>
          {isWhatsApp && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">WhatsApp</span>
              {isLoadingStatus ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : isConnected ? (
                <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Conectado</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <XCircle className="h-4 w-4" />
                  <span>Desconectado</span>
                </div>
              )}
            </div>
          )}
          {isWhatsApp && !isConnected && !isLoadingStatus && (
            <Button
              onClick={onStartWhatsApp}
              disabled={isLoading}
              className="w-full"
              size="sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <QrCode className="mr-2 h-4 w-4" />
                  Conectar WhatsApp
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

