export default async function ConversationsPage() {
  return (
    <div className="flex h-full items-center justify-center text-muted-foreground flex-col gap-4 bg-muted/10">
       <div className="bg-muted p-6 rounded-full">
          <span className="text-4xl opacity-50">💬</span>
       </div>
       <div className="text-center space-y-1">
          <h3 className="font-semibold text-lg">Suas Conversas</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Selecione uma conversa ao lado para visualizar as mensagens e responder.
          </p>
       </div>
    </div>
  )
}
