'use client'

import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { ReactNode, useState } from 'react'

export function Modal({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [open, setOpen] = useState(true)

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      router.back()
    }
  }

  // Acessibilidade: O Dialog precisa de um título
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent 
        showCloseButton={false} 
        overlayClassName="bg-black/95 backdrop-blur-md"
        className="max-w-none w-screen h-screen p-0 bg-transparent border-none overflow-hidden shadow-none flex items-center justify-center focus:outline-none sm:rounded-none z-[100]"
      >
        <DialogTitle className="sr-only">Visualizador de Mídia</DialogTitle>
        
        <div className="w-full h-full" onClick={(e) => e.stopPropagation()}>
          {children}
        </div>
      </DialogContent>
    </Dialog>
  )
}
