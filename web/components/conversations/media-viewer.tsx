'use client'

import { AuthenticatedMedia } from './authenticated-media'
import { X, Download, ZoomIn, ZoomOut, Maximize, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter, useSearchParams } from 'next/navigation'
import { api } from '@/lib/api/client'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface MediaViewerProps {
  mediaId: string
  isFullPage?: boolean
  type?: 'image' | 'video' | 'audio'
  mimeType?: string
}

export function MediaViewer({ mediaId, isFullPage = false, type: propType, mimeType: propMimeType }: MediaViewerProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [zoom, setZoom] = useState(1)
  
  const type = propType || (searchParams.get('type') as any) || 'image'
  const mimeType = propMimeType || searchParams.get('mimeType') || 'image/jpeg'

  const handleDownload = async () => {
    try {
      const { data } = await api.get(`/storage/${mediaId}/download?download=true`)
      
      if (data.url) {
        const link = document.createElement('a')
        link.href = data.url
        link.setAttribute('download', data.originalName || 'download')
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (error) {
      console.error('Erro ao baixar mídia:', error)
    }
  }

  const toggleZoom = () => {
    setZoom(prev => prev === 1 ? 2 : 1)
  }

  return (
    <div className={cn(
      "relative flex flex-col items-center justify-center w-full h-screen bg-transparent",
      isFullPage && "bg-black"
    )}>
      
      {/* Header com Glassmorphism - Premium Look */}
      <div className="absolute top-0 left-0 right-0 z-[100] flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-3">
          <Button 
            size="icon" 
            variant="ghost" 
            className="rounded-full text-white hover:bg-white/10" 
            onClick={() => router.back()}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-white/90">Visualizador de Mídia</span>
            <span className="text-[10px] text-white/50 uppercase tracking-widest">{type}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {type === 'image' && (
            <>
              <Button 
                size="icon" 
                variant="secondary" 
                className="rounded-full bg-white/10 hover:bg-white/20 border-none text-white backdrop-blur-md"
                onClick={() => setZoom(z => Math.max(1, z - 0.5))}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button 
                size="icon" 
                variant="secondary" 
                className="rounded-full bg-white/10 hover:bg-white/20 border-none text-white backdrop-blur-md"
                onClick={() => setZoom(z => Math.min(3, z + 0.5))}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </>
          )}
          
          <Button 
            size="icon" 
            variant="secondary" 
            className="rounded-full bg-white/10 hover:bg-white/20 border-none text-white backdrop-blur-md"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4" />
          </Button>

          <Button 
            size="icon" 
            variant="destructive" 
            className="rounded-full bg-white/10 hover:bg-red-500/80 border-none text-white backdrop-blur-md transition-colors"
            onClick={() => router.back()}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="w-full h-full flex items-center justify-center overflow-auto p-4 md:p-10 custom-scrollbar">
        <div 
          className="transition-transform duration-300 ease-out flex items-center justify-center"
          style={{ transform: `scale(${zoom})` }}
          onDoubleClick={type === 'image' ? toggleZoom : undefined}
        >
          <AuthenticatedMedia 
            mediaId={mediaId}
            type={type}
            mimeType={mimeType}
            className={cn(
              "max-w-full max-h-[85vh] object-contain rounded-sm shadow-[0_0_50px_rgba(0,0,0,0.5)] select-none",
              zoom > 1 && "max-h-[200vh] cursor-zoom-out",
              zoom === 1 && type === 'image' && "cursor-zoom-in"
            )}
          />
        </div>
      </div>

      {/* Footer / Info (Opcional) */}
      <div className="absolute bottom-4 text-white/40 text-[11px] font-light tracking-wide italic">
        Omni Media Hub • {new Date().toLocaleDateString()}
      </div>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  )
}
