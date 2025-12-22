import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { queryKeys } from '@/lib/query/keys'
import type { Tenant } from './types'

export function useTenants() {
  return useQuery({
    queryKey: queryKeys.tenants.all(),
    queryFn: () => apiClient.get<Tenant[]>('/tenants'),
  })
}

export function useTenant(id: string) {
  return useQuery({
    queryKey: queryKeys.tenants.detail(id),
    queryFn: () => apiClient.get<Tenant>(`/tenants/${id}`),
    enabled: !!id,
  })
}

