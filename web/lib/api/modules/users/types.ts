import { UserRole } from '@/lib/api/types'

export interface CreateUserDto {
  name: string
  email: string
  password: string
  tenantId: string
}

export interface UpdateUserDto {
  name?: string
  email?: string
  password?: string
  tenantId?: string
}

export interface User {
  id: string
  name: string
  email: string
  active: boolean
  avatarUrl?: string
  role: UserRole
  createdAt: string
  updatedAt: string
}

