import { ChannelType } from '@/lib/api/types'

export interface CreateChannelDto {
  name: string
  type: ChannelType
  identifier?: string
  token?: string
}

export interface UpdateChannelDto {
  name?: string
  type?: ChannelType
  identifier?: string
  token?: string
}

export interface Channel {
  id: string
  name: string
  type: ChannelType
  identifier?: string
  active: boolean
  tenantId: string
  createdAt: string
  updatedAt: string
}

