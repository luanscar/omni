import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { queryKeys } from '@/lib/query/keys'
import type { Tenant } from './types'
import { useMe } from '@/lib/api/modules/auth'

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

export function useMyTenant() {
  const { data: user } = useMe()
  const tenantId = user?.tenantId
  
  return useQuery({
    queryKey: queryKeys.tenants.detail(tenantId || ''),
    queryFn: () => apiClient.get<Tenant>(`/tenants/${tenantId}`),
    enabled: !!tenantId,
  })
}

