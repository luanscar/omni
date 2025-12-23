export interface LoginDto {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  user?: {
    id: string
    name: string
    email: string
    role: string
  }
}

export interface User {
  id: string
  name: string
  email: string
  active: boolean
  avatarUrl?: string
  role: string
  tenantId: string
  createdAt: string
  updatedAt: string
}

