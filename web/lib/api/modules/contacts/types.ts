export interface CreateContactDto {
  name: string
  phoneNumber?: string
  email?: string
  profilePicUrl?: string
  customFields?: Record<string, unknown>
}

export interface UpdateContactDto {
  name?: string
  phoneNumber?: string
  email?: string
  profilePicUrl?: string
  customFields?: Record<string, unknown>
}

export interface Contact {
  id: string
  name: string
  phoneNumber?: string
  email?: string
  profilePicUrl?: string
  customFields?: Record<string, unknown>
  tenantId: string
  createdAt: string
  updatedAt: string
}

