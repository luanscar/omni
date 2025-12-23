import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import type { Conversation } from '@/lib/api/modules/conversations/types'

interface UnreadMessagesState {
  totalUnreadCount: number
  setConversations: (conversations: Conversation[]) => void
}

// Função para calcular o total de mensagens não lidas
function calculateTotalUnread(conversations: Conversation[]): number {
  return conversations.reduce((total, conversation) => {
    return total + (conversation.unreadCount || 0)
  }, 0)
}

export const useUnreadMessagesStore = create<UnreadMessagesState>()(
  devtools(
    subscribeWithSelector((set) => ({
      totalUnreadCount: 0,

      setConversations: (conversations) => {
        const total = calculateTotalUnread(conversations)
        set({ totalUnreadCount: total }, false, 'setConversations')
      },
    })),
    { name: 'UnreadMessagesStore' }
  )
)
