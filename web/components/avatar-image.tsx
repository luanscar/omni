'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useStorageDownloadUrl } from '@/lib/api/modules/storage'

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

  // Extrair ID do storage se for um caminho relativo
  // Formato esperado: /storage/{id}/download
  const storageId = src?.startsWith('/storage/')
    ? src.replace('/storage/', '').replace('/download', '').split('/')[0]
    : null

  // Buscar URL assinada se for do storage
  const { data: downloadData, error: downloadError } = useStorageDownloadUrl(
    storageId || '',
  )

  // Determinar a URL final
  // Se for do storage e tiver a URL assinada, usa ela
  // Caso contrário, usa a URL original (pode ser externa ou undefined)
  const imageUrl = storageId && downloadData?.url && !downloadError
    ? downloadData.url 
    : (src && !src.startsWith('/storage/') ? src : undefined)

  // Se houver erro ao carregar a imagem ou se não houver URL, mostra fallback
  const shouldShowFallback = imageError || !imageUrl || downloadError

  return (
    <Avatar className={className}>
      {!shouldShowFallback && (
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

