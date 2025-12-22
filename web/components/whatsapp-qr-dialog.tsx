'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useWhatsAppQr, useWhatsAppStatus } from '@/lib/api/modules/whatsapp'
import { useSocketEvent } from '@/hooks/use-socket'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query/keys'
import { Loader2, QrCode } from 'lucide-react'

interface WhatsAppQrDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  channelId: string
  channelName: string
}

export function WhatsAppQrDialog({
  open,
  onOpenChange,
  channelId,
  channelName,
}: WhatsAppQrDialogProps) {
  const { data: qrBlob, isLoading: isLoadingQr } = useWhatsAppQr(channelId)
  const { data: status } = useWhatsAppStatus(channelId)
  const queryClient = useQueryClient()
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [socketQrCode, setSocketQrCode] = useState<string | null>(null)

  // Escutar evento de QR Code via socket
  useSocketEvent<{
    channelId: string
    qrCode: string
    timestamp: string
  }>(
    'whatsapp:qrcode',
    (data) => {
      if (data.channelId === channelId) {
        console.log('QR Code recebido via socket:', data.channelId)
        setSocketQrCode(data.qrCode)
        // Invalidar query para garantir sincronização
        queryClient.invalidateQueries({
          queryKey: queryKeys.whatsapp.qr(channelId),
        })
      }
    },
    open // Só escutar quando o dialog estiver aberto
  )

  // Escutar evento de conexão estabelecida
  useSocketEvent<{
    channelId: string
    status: string
    identifier?: string
    timestamp: string
  }>(
    'whatsapp:connected',
    (data) => {
      if (data.channelId === channelId && open) {
        console.log('WhatsApp conectado via socket:', data.channelId)
        // Fechar dialog após 2 segundos
        setTimeout(() => {
          onOpenChange(false)
        }, 2000)
      }
    },
    open
  )

  // Priorizar QR Code do socket se disponível, senão usar o do blob
  useEffect(() => {
    if (socketQrCode) {
      setQrUrl(socketQrCode)
    } else if (qrBlob) {
      const url = URL.createObjectURL(qrBlob)
      setQrUrl(url)
      return () => URL.revokeObjectURL(url)
    } else {
      setQrUrl(null)
    }
  }, [qrBlob, socketQrCode])

  // Fechar automaticamente quando conectar
  useEffect(() => {
    if (status?.connected && open) {
      setTimeout(() => {
        onOpenChange(false)
      }, 2000)
    }
  }, [status?.connected, open, onOpenChange])

  // Limpar QR code do socket quando o dialog fechar
  useEffect(() => {
    if (!open) {
      setSocketQrCode(null)
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Conectar WhatsApp - {channelName}</DialogTitle>
          <DialogDescription>
            Escaneie o QR Code com o WhatsApp para conectar
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          {isLoadingQr ? (
            <div className="flex flex-col items-center gap-2 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Gerando QR Code...
              </p>
            </div>
          ) : qrUrl ? (
            <>
              <div className="rounded-lg border-2 border-primary p-4">
                <img
                  src={qrUrl}
                  alt="QR Code WhatsApp"
                  className="h-64 w-64"
                />
              </div>
              {status?.connected ? (
                <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-600 dark:text-green-400">
                  ✓ Conectado com sucesso!
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center">
                  1. Abra o WhatsApp no seu celular
                  <br />
                  2. Toque em Menu ou Configurações
                  <br />
                  3. Toque em Aparelhos conectados
                  <br />
                  4. Toque em Conectar um aparelho
                  <br />
                  5. Aponte seu celular para esta tela para capturar o código
                </p>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 py-8">
              <QrCode className="h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                QR Code não disponível
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

