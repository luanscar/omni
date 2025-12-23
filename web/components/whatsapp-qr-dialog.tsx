'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useWhatsAppQr, useWhatsAppStatus } from '@/lib/api/modules/whatsapp'
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
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [socketQrCode, setSocketQrCode] = useState<string | null>(null)

  // ... (socket listeners)

  // ... (socket listeners)

  // Gerenciar URL do Blob separadamente para limpeza correta
  useEffect(() => {
    if (qrBlob && !socketQrCode) {
      const url = URL.createObjectURL(qrBlob)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBlobUrl(url)
      return () => URL.revokeObjectURL(url)
    } else {
      setBlobUrl(null)
    }
  }, [qrBlob, socketQrCode])

  const qrUrl = socketQrCode || blobUrl

  // Fechar automaticamente quando conectar
  useEffect(() => {
    if (status?.connected && open) {
      setTimeout(() => {
        onOpenChange(false)
      }, 2000)
    }
  }, [status?.connected, open, onOpenChange])

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSocketQrCode(null)
    }
    onOpenChange(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
                <div className="rounded-md bg-primary/10 p-3 text-sm text-primary">
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

