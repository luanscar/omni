export interface CreateTenantDto {
  name: string
  slug: string
}

export interface UpdateTenantDto {
  name?: string
  slug?: string
}

export interface Tenant {
  id: string
  name: string
  slug: string
  active: boolean
  createdAt: string
  updatedAt: string
}

