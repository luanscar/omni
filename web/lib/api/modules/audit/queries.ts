import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { queryKeys } from '@/lib/query/keys'
import type { AuditLog, AuditLogsParams, AuditStats } from './types'

export function useAuditLogs(params?: AuditLogsParams) {
  return useQuery({
    queryKey: queryKeys.audit.logs(params),
    queryFn: () => {
      const searchParams = new URLSearchParams()
      if (params?.eventType) searchParams.append('eventType', params.eventType)
      if (params?.module) searchParams.append('module', params.module)
      if (params?.status) searchParams.append('status', params.status)
      if (params?.startDate)
        searchParams.append('startDate', params.startDate)
      if (params?.endDate) searchParams.append('endDate', params.endDate)
      if (params?.limit) searchParams.append('limit', params.limit.toString())
      if (params?.offset)
        searchParams.append('offset', params.offset.toString())

      const queryString = searchParams.toString()
      return apiClient.get<AuditLog[]>(
        `/audit/logs${queryString ? `?${queryString}` : ''}`
      )
    },
  })
}

export function useAuditLog(id: string) {
  return useQuery({
    queryKey: queryKeys.audit.detail(id),
    queryFn: () => apiClient.get<AuditLog>(`/audit/logs/${id}`),
    enabled: !!id,
  })
}

export function useAuditStats(startDate: string, endDate: string) {
  return useQuery({
    queryKey: queryKeys.audit.stats(startDate, endDate),
    queryFn: () =>
      apiClient.get<AuditStats>(
        `/audit/stats?startDate=${startDate}&endDate=${endDate}`
      ),
    enabled: !!startDate && !!endDate,
  })
}

