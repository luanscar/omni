import { MessageType } from '@/lib/api/types'

export interface LocationMessageDto {
  degreesLatitude: number
  degreesLongitude: number
  name?: string
  address?: string
}

export interface ContactMessageDto {
  displayName: string
  vcard: string
}

export interface ReactionMessageDto {
  text: string
  key: string
}

export interface CreateMessageDto {
  conversationId: string
  type: MessageType
  content?: string
  mediaId?: string
  replyToId?: string
  signMessage?: boolean
  location?: LocationMessageDto
  contact?: ContactMessageDto
  reaction?: ReactionMessageDto
}

export interface BatchMessageItemDto {
  type: MessageType
  content?: string
  mediaId?: string
  replyToId?: string
  signMessage?: boolean
  location?: LocationMessageDto
  contact?: ContactMessageDto
  reaction?: ReactionMessageDto
}

export interface BatchMessageDto {
  conversationId: string
  messages: BatchMessageItemDto[]
}

export interface ForwardMessageDto {
  messageId: string
  targetConversationIds: string[]
}

export interface ForwardBatchDto {
  messageIds: string[]
  targetConversationIds: string[]
}

export interface MessageSenderUser {
  id: string
  name: string
  avatarUrl?: string
}

export interface MessageSenderContact {
  id: string
  name: string
  phoneNumber?: string
  profilePicUrl?: string
}

export interface MessageMedia {
  id: string
  fileName: string
  originalName: string
  mimeType: string
  size?: number
  publicUrl: string
}

export interface Message {
  id: string
  providerId: string
  type: MessageType
  content: string
  metadata?: Record<string, unknown>
  conversationId: string
  senderType: 'USER' | 'CONTACT' | 'SYSTEM'
  senderUserId?: string
  senderUser?: MessageSenderUser
  senderContactId?: string
  senderContact?: MessageSenderContact
  mediaId?: string
  media?: MessageMedia
  quotedMessage?: Message
  status: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED'
  read: boolean
  createdAt: string
}

