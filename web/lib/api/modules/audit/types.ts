import { AuditEventType, AuditStatus } from '@/lib/api/types'

export interface AuditLog {
  id: string
  tenantId: string
  userId?: string
  eventType: AuditEventType
  module?: string
  action: string
  resource?: string
  details: Record<string, unknown>
  status: AuditStatus
  errorMessage?: string
  ipAddress?: string
  userAgent?: string
  createdAt: string
}

export interface AuditLogsParams {
  eventType?: AuditEventType
  module?: string
  status?: AuditStatus
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
}

export interface AuditStats {
  total: number
  byEventType: Record<AuditEventType, number>
  byStatus: Record<AuditStatus, number>
  byModule: Record<string, number>
}

