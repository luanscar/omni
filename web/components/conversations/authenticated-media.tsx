'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api/client'
import { Loader2 } from 'lucide-react'

interface AuthenticatedMediaProps {
  mediaId: string
  mimeType: string
  alt?: string
  className?: string
  type: 'image' | 'video' | 'audio'
  onClick?: () => void
}

export function AuthenticatedMedia({
  mediaId,
  mimeType,
  alt,
  className,
  type,
  onClick
}: AuthenticatedMediaProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchMediaUrl = async () => {
      try {
        console.log('[MEDIA DEBUG] Buscando URL assinada para mediaId:', mediaId)
        setIsLoading(true)
        setError(false)

        // Pegar a URL presigned do backend
        const response = await api.get(`/storage/${mediaId}/download`)

        if (response.data && response.data.url) {
          console.log('[MEDIA DEBUG] URL assinada recebida:', response.data.url)
          setBlobUrl(response.data.url)
        } else {
          console.error('[MEDIA DEBUG] URL não encontrada na resposta do backend')
          setError(true)
        }
      } catch (err: unknown) {
        console.error('[MEDIA DEBUG] Erro ao buscar URL da mídia:', err)
        setError(true)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMediaUrl()
  }, [mediaId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 bg-muted/20 rounded-lg">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !blobUrl) {
    return (
      <div className="flex items-center justify-center p-8 bg-destructive/10 rounded-lg text-destructive text-sm text-center">
        Erro ao carregar mídia<br />
        <span className="text-[10px] opacity-50">{mediaId}</span>
      </div>
    )
  }

  const handleMediaError = (e: React.SyntheticEvent<HTMLImageElement | HTMLVideoElement | HTMLAudioElement, Event>) => {
    console.error(`[MEDIA DEBUG] Erro de renderização no elemento ${type}:`, e)
    // Se falhar ao carregar, pode ser que a URL expirou ou o LocalStack está inacessível
  }

  switch (type) {
    case 'image':
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={blobUrl}
          alt={alt || 'Imagem'}
          className={className}
          onClick={onClick}
          onError={handleMediaError}
          onLoad={() => console.log('[MEDIA DEBUG] Imagem carregada com sucesso')}
        />
      )

    case 'video':
      return (
        <video
          controls
          className={className}
          preload="metadata"
          onError={handleMediaError}
        >
          <source src={blobUrl} type={mimeType} />
          Seu navegador não suporta vídeo.
        </video>
      )

    case 'audio':
      return (
        <audio
          controls
          className={className}
          onError={handleMediaError}
        >
          <source src={blobUrl} type={mimeType} />
          Seu navegador não suporta áudio.
        </audio>
      )

    default:
      return null
  }
}
