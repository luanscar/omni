# 🔍 Sistema de Auditoria (Audit Log)

> **Status:** Planejado (Não Implementado)  
> **Prioridade:** Alta  
> **Estimativa:** 1 semana  

## 🎯 Objetivo

Criar sistema completo de auditoria para rastrear **TODAS as ações** no sistema, especialmente:
- ✅ Mensagens recebidas/enviadas
- ✅ Falhas de download de mídia
- ✅ Ações de usuários (login, logout, updates)
- ✅ Mudanças em conversas
- ✅ Erros do sistema

---

## 📊 1. Modelo de Banco de Dados

### **Nova Tabela: AuditLog**

```prisma
model AuditLog {
  id        String   @id @default(uuid())
  
  // Identificação
  tenantId  String
  tenant    Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  userId    String?  // Null se for ação do sistema
  user      User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  
  // Tipo de evento
  eventType AuditEventType
  module    String   // whatsapp, messages, users, auth, etc
  action    String   // message.received, message.sent, user.login, etc
  
  // Detalhes
  resource  String?  // ID do recurso afetado (messageId, userId, etc)
  details   Json?    // Dados completos do evento
  
  // Status
  status    AuditStatus  @default(SUCCESS)
  errorMessage String?   // Se falhou, detalhe do erro
  
  // Metadata
  ipAddress String?
  userAgent String?
  
  createdAt DateTime @default(now())
  
  @@map("audit_logs")
  @@index([tenantId, createdAt])
  @@index([eventType, status])
  @@index([module, action])
  @@index([resource])
}

enum AuditEventType {
  MESSAGE        // Mensagens WhatsApp
  USER_ACTION    // Ações de usuários
  SYSTEM_EVENT   // Eventos do sistema
  MEDIA_DOWNLOAD // Download de mídias
  AUTH           // Autenticação
  DATA_CHANGE    // Alteração de dados
  ERROR          // Erros gerais
}

enum AuditStatus {
  SUCCESS
  FAILED
  PARTIAL  // Parcialmente executado
  PENDING
}
```

---

## 🔧 2. Implementação

### **2.1. AuditService**

```typescript
// src/modules/audit/audit.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AuditEventType, AuditStatus } from '@prisma/client';

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
      failures: logs.filter(l => l.status === AuditStatus.FAILED).length,
    };

    logs.forEach(log => {
      stats.byEventType[log.eventType] = (stats.byEventType[log.eventType] || 0) + 1;
      stats.byStatus[log.status] = (stats.byStatus[log.status] || 0) + 1;
      stats.byModule[log.module] = (stats.byModule[log.module] || 0) + 1;
    });

    return stats;
  }
}
```

---

## 📝 3. Integração com Módulos Existentes

### **3.1. WhatsappProcessor**

```typescript
// src/modules/whatsapp/whatsapp.processor.ts

async handleIncomingMessage(job: Job<any>) {
  const { message, channelId, tenantId } = job.data;
  
  try {
    // ... código existente ...
    
    // ✅ Log de sucesso
    await this.auditService.logMessage({
      tenantId,
      messageId: savedMessage.id,
      action: 'received',
      details: {
        from: remoteJid,
        type: messageType,
        hasMedia: !!mediaId,
      },
      status: AuditStatus.SUCCESS,
    });
    
  } catch (error) {
    // ❌ Log de falha
    await this.auditService.logMessage({
      tenantId,
      messageId: null,
      action: 'failed',
      details: {
        from: message.key.remoteJid,
        error: error.message,
      },
      status: AuditStatus.FAILED,
      errorMessage: error.message,
    });
  }
}

async downloadAndSaveMedia(...) {
  // ... código existente com retry ...
  
  // Log do resultado do download
  await this.auditService.logMediaDownload({
    tenantId,
    messageId: message.key.id,
    mediaType: type,
    success: !!media,
    attempts: attempt,
    errorMessage: !media ? error.message : undefined,
  });
}
```

### **3.2. AuthController**

```typescript
// src/modules/auth/auth.controller.ts

@Post('login')
async login(@Body() loginDto: LoginDto, @Req() req: FastifyRequest) {
  try {
    const result = await this.authService.login(loginDto);
    
    // ✅ Log de login bem-sucedido
    await this.auditService.logUserAction({
      tenantId: result.user.tenantId,
      userId: result.user.id,
      action: 'user.login',
      details: { email: loginDto.email },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    
    return result;
  } catch (error) {
    // ❌ Log de falha de login
    await this.auditService.log({
      tenantId: 'UNKNOWN',
      eventType: AuditEventType.AUTH,
      module: 'auth',
      action: 'user.login.failed',
      details: { email: loginDto.email },
      status: AuditStatus.FAILED,
      errorMessage: error.message,
      ipAddress: req.ip,
    });
    
    throw error;
  }
}
```

### **3.3. MessagesService**

```typescript
// src/modules/messages/messages.service.ts

async create(...) {
  // ... código existente ...
  
  // Log de mensagem enviada
  await this.auditService.logMessage({
    tenantId,
    messageId: message.id,
    action: 'sent',
    details: {
      to: conversation.contact?.phoneNumber,
      type: type,
      hasMedia: !!mediaId,
    },
    status: AuditStatus.SUCCESS,
  });
}
```

---

## 🌐 4. API Endpoints

### **AuditController**

```typescript
// src/modules/audit/audit.controller.ts

@Controller('audit')
@ApiBearerAuth()
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get('logs')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Listar logs de auditoria' })
  async getLogs(
    @Query('eventType') eventType?: AuditEventType,
    @Query('module') module?: string,
    @Query('status') status?: AuditStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Request() req?,
  ) {
    return this.auditService.findLogs({
      tenantId: req.user.tenantId,
      eventType,
      module,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit,
      offset,
    });
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Estatísticas de auditoria' })
  async getStats(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Request() req,
  ) {
    return this.auditService.getStats(
      req.user.tenantId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('logs/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Detalhes de um log específico' })
  async getLogDetails(@Param('id') id: string) {
    return this.prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
      },
    });
  }
}
```

---

## 📊 5. Dashboard de Auditoria (Frontend)

### **Componentes UI**

```tsx
// AuditDashboard.tsx

- Timeline de eventos
- Filtros por tipo, módulo, status, data
- Detalhes de cada log (modal)
- Gráfico de eventos por hora
- Lista de falhas recentes
- Exportar logs (CSV/JSON)
- Estatísticas em tempo real
```

### **Mockup**

```
┌──────────────────────────────────────────────────────┐
│  🔍 Auditoria                    [Exportar] [Filtros]│
├──────────────────────────────────────────────────────┤
│                                                      │
│  📊 Últimas 24h                                      │
│  ┌─────────┬──────────┬──────────┬──────────┐        │
│  │ Total   │ Sucessos │ Falhas   │ Pendente │        │
│  │  1,234  │  1,180   │   54     │    0     │        │
│  └─────────┴──────────┴──────────┴──────────┘        │
│                                                      │
│  📅 Timeline:                                        │
│  ✅ 12:45:30 - Mensagem recebida (João Silva)       │
│  ❌ 12:44:15 - Falha download mídia (CNH-e.pdf)     │
│  ✅ 12:43:00 - Mensagem enviada (Maria Santos)      │
│  ✅ 12:42:30 - Login (admin@omni.com)               │
│  ❌ 12:41:00 - Falha login (wrong password)         │
│                                                      │
│  [Ver mais...]                                      │
└──────────────────────────────────────────────────────┘
```

---

## 🔔 6. Alertas e Notificações

### **Monitoramento Proativo**

```typescript
// src/modules/audit/audit.monitor.ts

@Injectable()
export class AuditMonitor {
  
  // Detectar muitas falhas em curto período
  @Cron('*/5 * * * *') // A cada 5 minutos
  async checkForAnomalies() {
    const last5Minutes = new Date(Date.now() - 5 * 60 * 1000);
    
    const failures = await this.prisma.auditLog.count({
      where: {
        status: AuditStatus.FAILED,
        createdAt: { gte: last5Minutes },
      },
    });
    
    if (failures > 10) {
      // Enviar alerta
      await this.notificationService.sendAlert({
        type: 'AUDIT_ANOMALY',
        message: `${failures} falhas detectadas nos últimos 5 minutos`,
        severity: 'warning',
      });
    }
  }
  
  // Alertar sobre downloads de mídia falhando
  @Cron('*/10 * * * *') // A cada 10 minutos
  async checkMediaDownloadFailures() {
    // ...
  }
}
```

---

## 🧹 7. Limpeza de Logs Antigos

```typescript
// src/modules/audit/audit.cleanup.job.ts

@Injectable()
export class AuditCleanupJob {
  
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupOldLogs() {
    // Manter apenas últimos 90 dias (configurável)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);
    
    const deleted = await this.prisma.auditLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        status: AuditStatus.SUCCESS, // Manter falhas por mais tempo
      },
    });
    
    console.log(`Deleted ${deleted.count} old audit logs`);
  }
}
```

---

## ✅ Checklist de Implementação

### **Fase 1: Base (3 dias)**
- [ ] Criar modelo AuditLog no Prisma
- [ ] Migração do banco
- [ ] Criar AuditService
- [ ] Criar enums AuditEventType e AuditStatus

### **Fase 2: Integração (2 dias)**
- [ ] Integrar com WhatsappProcessor
- [ ] Integrar com MessagesService
- [ ] Integrar com AuthController
- [ ] Integrar com ConversationsService

### **Fase 3: API (1 dia)**
- [ ] Criar AuditController
- [ ] Endpoints de listagem
- [ ] Endpoint de estatísticas
- [ ] Filtros e paginação

### **Fase 4: Monitoramento (1 dia)**
- [ ] Job de detecção de anomalias
- [ ] Alertas de falhas
- [ ] Job de limpeza automática

### **Fase 5: Frontend (futuro)**
- [ ] Dashboard de auditoria
- [ ] Timeline de eventos
- [ ] Filtros avançados
- [ ] Exportação de logs

---

## 📈 Métricas de Sucesso

- **Rastreabilidade:** 100% das mensagens auditadas
- **Performance:** Logs não devem adicionar > 50ms por operação
- **Cobertura:** Todas as ações críticas logadas
- **Retenção:** Logs mantidos por 90 dias mínimo

---

## 🎯 Casos de Uso

### **1. Investigar mensagem perdida**
```
Usuário: "Não recebi a mensagem"
Admin: Busca logs → Encontra falha de download → Vê que URL expirou
```

### **2. Detectar tentativas de invasão**
```
Sistema: Detecta 10 falhas de login em 1 minuto
Alerta: Admin é notificado imediatamente
```

### **3. Análise de performance**
```
Admin: Vê que 30% dos downloads falham entre 12h e 13h
Ação: Investigar conexão/servidor nesse horário
```

### **4. Compliance/Auditoria**
```
Auditor: "Quem enviou esta mensagem?"
Sistema: Log mostra userId, IP, timestamp exato
```

---

**Última Atualização:** 2025-12-22  
**Versão:** 1.0  
**Autor:** Equipe de Desenvolvimento
