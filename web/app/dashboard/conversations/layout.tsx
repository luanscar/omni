import { ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { ConversationList } from '@/components/conversations/conversation-list'

export default function ConversationsLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="grid h-full grid-cols-12 gap-0">
        {/* Sidebar - Lista de Conversas (Persistente) */}
        <Card className="col-span-12 md:col-span-5 lg:col-span-4 h-full border-r rounded-none shadow-none overflow-hidden flex flex-col">
          <ConversationList />
        </Card>

        {/* Área Principal (Conteúdo Dinâmico) */}
        <div className="hidden md:flex col-span-12 md:col-span-7 lg:col-span-8 h-full border-r rounded-none overflow-hidden bg-background shadow-none flex-col">
          {children}
        </div>
      </div>
    </div>
  )
}
