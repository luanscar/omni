'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useStorageDownloadUrl } from '@/lib/api/modules/storage'
import { extractStorageId, getStorageUrl } from '@/lib/utils/storage'

interface AvatarImageProps {
  src?: string | null
  alt: string
  fallback: string
  className?: string
}

/**
 * Componente Avatar que trata automaticamente URLs do storage
 * Se a URL começar com /storage/, busca a URL assinada da API
 * Caso contrário, usa a URL diretamente
 */
export function AvatarImageWithStorage({
  src,
  alt,
  fallback,
  className,
}: AvatarImageProps) {
  const [imageError, setImageError] = useState(false)

  // Extrair ID do storage usando a função utilitária
  const storageId = extractStorageId(src || null)

  // Buscar URL assinada se for do storage
  const { data: downloadData, error: downloadError, isLoading } = useStorageDownloadUrl(
    storageId || '',
  )

  // Determinar a URL final
  // Se for do storage e tiver a URL assinada, usa ela
  // Caso contrário, se não for do storage (URL externa ou completa), usa diretamente ou converte se for relativa
  // Se for do storage mas ainda estiver carregando, retorna undefined para mostrar fallback temporariamente
  const imageUrl = storageId
    ? (downloadData?.url && !downloadError ? downloadData.url : undefined)
    : (src ? (src.startsWith('http://') || src.startsWith('https://') ? src : getStorageUrl(src)) : undefined)

  // Mostra fallback se: houver erro, não houver URL, ou se for storage e ainda estiver carregando
  const shouldShowFallback = imageError || !imageUrl || (storageId && isLoading)

  return (
    <Avatar className={className}>
      {!shouldShowFallback && imageUrl && (
        <AvatarImage 
          src={imageUrl} 
          alt={alt}
          onError={() => setImageError(true)}
        />
      )}
      <AvatarFallback>{fallback}</AvatarFallback>
    </Avatar>
  )
}

