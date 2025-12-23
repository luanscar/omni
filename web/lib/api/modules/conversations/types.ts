import { ConversationStatus } from '@/lib/api/types'

export interface CreateConversationDto {
  contactId?: string
  channelId?: string
  teamId?: string
}

export interface UpdateConversationDto {
  status?: ConversationStatus
  assigneeId?: string
}

export interface ConversationContact {
  name: string
  profilePicUrl?: string
}

export interface ConversationAssignee {
  name: string
  avatarUrl?: string
}

export interface ConversationTeam {
  name: string
}

export interface ConversationCount {
  messages: number
}

export interface ConversationMedia {
  id: string
  fileName: string
  mimeType: string
  publicUrl?: string
}

export interface ConversationMessageSender {
  name: string
}

export interface ConversationMessage {
  id: string
  providerId: string
  content: string
  senderType: 'USER' | 'CONTACT' | 'SYSTEM'
  media?: ConversationMedia
  senderContact?: ConversationMessageSender
  senderUser?: ConversationMessageSender
  read: boolean
  createdAt: string
}

export interface Conversation {
  id: string
  sequenceId: number
  tenantId: string
  contactId?: string
  channelId?: string
  teamId?: string
  tags?: string[]
  assigneeId?: string
  remoteJid?: string
  status: ConversationStatus
  isGroup?: boolean  // Indica se é grupo WhatsApp
  contact?: ConversationContact
  assignee?: ConversationAssignee
  team?: ConversationTeam
  _count: ConversationCount
  messages: ConversationMessage[]
  unreadCount?: number
  createdAt: string
  updatedAt: string
}

