import { ApiProperty } from '@nestjs/swagger';
import { AuditEventType, AuditStatus } from 'prisma/generated/enums';

export class AuditLog {
  @ApiProperty({ example: 'fa4c178f-6595-40b9-a569-3d5c079288e5' })
  id: string;

  @ApiProperty({ example: 'tenant-uuid-here' })
  tenantId: string;

  @ApiProperty({
    example: 'user-uuid-here',
    required: false,
    description: 'ID do usuário que executou a ação',
  })
  userId?: string;

  @ApiProperty({
    enum: AuditEventType,
    example: AuditEventType.MESSAGE,
    description: 'Tipo do evento auditado',
  })
  eventType: AuditEventType;

  @ApiProperty({
    example: 'whatsapp',
    description: 'Módulo onde o evento ocorreu',
  })
  module: string;

  @ApiProperty({
    example: 'message.sent',
    description: 'Ação executada',
  })
  action: string;

  @ApiProperty({
    example: 'msg-uuid-here',
    required: false,
    description: 'ID do recurso afetado',
  })
  resource?: string;

  @ApiProperty({
    example: { to: '5579000000000', type: 'TEXT', hasMedia: false },
    description: 'Detalhes adicionais do evento',
  })
  details: any;

  @ApiProperty({
    enum: AuditStatus,
    example: AuditStatus.SUCCESS,
    description: 'Status da operação',
  })
  status: AuditStatus;

  @ApiProperty({
    example: 'Error message here',
    required: false,
    description: 'Mensagem de erro (se falhou)',
  })
  errorMessage?: string;

  @ApiProperty({
    example: '192.168.1.100',
    required: false,
    description: 'Endereço IP de origem',
  })
  ipAddress?: string;

  @ApiProperty({
    example: 'Mozilla/5.0...',
    required: false,
    description: 'User agent do navegador/cliente',
  })
  userAgent?: string;

  @ApiProperty({ example: '2025-12-22T01:00:00.000Z' })
  createdAt: Date;
}
