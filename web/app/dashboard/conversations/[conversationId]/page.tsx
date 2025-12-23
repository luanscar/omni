import { ChatArea } from '@/components/conversations/chat-area'

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>
}) {
  const { conversationId } = await params

  return <ChatArea conversationId={conversationId} />
}
