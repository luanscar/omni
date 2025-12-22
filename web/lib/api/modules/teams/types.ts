import { TeamRole } from '@/lib/api/types'

export interface CreateTeamDto {
  name: string
  description?: string
  memberIds?: string[]
}

export interface UpdateTeamDto {
  name?: string
  description?: string
  memberIds?: string[]
}

export interface TeamUser {
  id: string
  name: string
  avatarUrl?: string
}

export interface TeamMember {
  id: string
  role: TeamRole
  user: TeamUser
}

export interface TeamCount {
  members: number
}

export interface Team {
  id: string
  name: string
  description?: string
  tenantId: string
  members: TeamMember[]
  _count: TeamCount
  createdAt: string
  updatedAt: string
}

export interface AddMemberDto {
  userId: string
  role: TeamRole
}

