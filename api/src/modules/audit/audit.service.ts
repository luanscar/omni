import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditEventType, AuditStatus } from 'prisma/generated/enums';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(params: {
    tenantId: string;
    userId?: string;
    eventType: AuditEventType;
    module: string;
    action: string;
    resource?: string;
    details?: any;
    status?: AuditStatus;
    errorMessage?: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    try {
      return await this.prisma.auditLog.create({
        data: {
          tenantId: params.tenantId,
          userId: params.userId,
          eventType: params.eventType,
          module: params.module,
          action: params.action,
          resource: params.resource,
          details: params.details || {},
          status: params.status || AuditStatus.SUCCESS,
          errorMessage: params.errorMessage,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
        },
      });
    } catch (error) {
      // Nunca falhar por causa de auditoria
      console.error('[AuditService] Failed to create audit log:', error);
    }
  }

  // Log específico para mensagens
  async logMessage(params: {
    tenantId: string;
    messageId: string;
    action: 'received' | 'sent' | 'failed';
    details: any;
    status: AuditStatus;
    errorMessage?: string;
  }) {
    return this.log({
      tenantId: params.tenantId,
      eventType: AuditEventType.MESSAGE,
      module: 'whatsapp',
      action: `message.${params.action}`,
      resource: params.messageId,
      details: params.details,
      status: params.status,
      errorMessage: params.errorMessage,
    });
  }

  // Log de download de mídia
  async logMediaDownload(params: {
    tenantId: string;
    messageId: string;
    mediaType: string;
    success: boolean;
    attempts: number;
    errorMessage?: string;
  }) {
    return this.log({
      tenantId: params.tenantId,
      eventType: AuditEventType.MEDIA_DOWNLOAD,
      module: 'whatsapp',
      action: 'media.download',
      resource: params.messageId,
      details: {
        mediaType: params.mediaType,
        attempts: params.attempts,
      },
      status: params.success ? AuditStatus.SUCCESS : AuditStatus.FAILED,
      errorMessage: params.errorMessage,
    });
  }

  // Log de ações de usuário
  async logUserAction(params: {
    tenantId: string;
    userId: string;
    action: string;
    resource?: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return this.log({
      tenantId: params.tenantId,
      userId: params.userId,
      eventType: AuditEventType.USER_ACTION,
      module: 'users',
      action: params.action,
      resource: params.resource,
      details: params.details,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  }

  // Buscar logs
  async findLogs(params: {
    tenantId: string;
    eventType?: AuditEventType;
    module?: string;
    status?: AuditStatus;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: any = { tenantId: params.tenantId };

    if (params.eventType) where.eventType = params.eventType;
    if (params.module) where.module = params.module;
    if (params.status) where.status = params.status;

    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) where.createdAt.gte = params.startDate;
      if (params.endDate) where.createdAt.lte = params.endDate;
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: params.limit || 100,
        skip: params.offset || 0,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { logs, total };
  }

  // Estatísticas
  async getStats(tenantId: string, startDate: Date, endDate: Date) {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const stats = {
      total: logs.length,
      byEventType: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      byModule: {} as Record<string, number>,
      failures: logs.filter((l) => l.status === AuditStatus.FAILED).length,
    };

    logs.forEach((log) => {
      stats.byEventType[log.eventType] =
        (stats.byEventType[log.eventType] || 0) + 1;
      stats.byStatus[log.status] = (stats.byStatus[log.status] || 0) + 1;
      stats.byModule[log.module] = (stats.byModule[log.module] || 0) + 1;
    });

    return stats;
  }
}
