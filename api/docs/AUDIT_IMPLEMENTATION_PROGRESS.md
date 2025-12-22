# ✅ Sistema de Auditoria - Progresso de Implementação

## ✅ JÁ IMPLEMENTADO

### **Fase 1: Base** ✅
- [x] Criado enum `AuditEventType` no schema
- [x] Criado enum `AuditStatus` no schema
- [x] Criado modelo `AuditLog` no schema
- [x] Migração do banco executada
- [x] Prisma Client regenerado
- [x] Criado `AuditService` completo (`/src/modules/audit/audit.service.ts`)
- [x] Criado `AuditModule` (`/src/modules/audit/audit.module.ts`)

### **Fase 3: API** ✅
- [x] Criado `AuditController` (`/src/modules/audit/audit.controller.ts`)
- [x] Endpoints GET /audit/logs
- [x] Endpoint GET /audit/stats
- [x] Endpoint GET /audit/logs/:id

---

## ⚠️ FALTA FAZER

###  **1. Registrar AuditModule no AppModule**

```typescript
// src/app.module.ts
import { AuditModule } from './modules/audit/audit.module';

@Module({
  imports: [
    // ... outros módulos
    AuditModule,
  ],
})
export class AppModule {}
```

### **2. Integrar com WhatsappProcessor** (Fase 2)

```typescript
// src/modules/whatsapp/whatsapp.processor.ts
import { AuditService } from '../audit/audit.service';
import { AuditStatus, AuditEventType } from 'prisma/generated/enums';

constructor(
  // ... existentes
  private auditService: AuditService,
) {}

async handleIncomingMessage(job: Job<any>) {
  try {
    // ... código existente ...
    
    // ✅ Log de sucesso
    await this.auditService.logMessage({
      tenantId,
      messageId: savedMessage.id,
      action: 'received',
      details: {
        from: remoteJid,
        type: extractedType,
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
        stack: error.stack,
      },
      status: AuditStatus.FAILED,
      errorMessage: error.message,
    });
  }
}
```

### **3. Integrar Download de Mídia**

```typescript
// No método downloadAndSaveMedia, após todas as tentativas:

// Log do resultado final
await this.auditService.logMediaDownload({
  tenantId,
  messageId: message.key.id,
  mediaType: type,
  success: !!media,
  attempts: maxRetries,
  errorMessage: !media ? 'Download failed after all retries' : undefined,
});
```

### **4. Integrar com AuthController**

```typescript
// src/modules/auth/auth.controller.ts
import { AuditService } from '../audit/audit.service';
import { AuditStatus } from 'prisma/generated/enums';

@Post('login')
async login(@Body() loginDto: LoginDto, @Req() req: FastifyRequest) {
  try {
    const result = await this.authService.login(loginDto);
    
    // ✅ Log login bem-sucedido
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
    // ❌ Log falha de login
    await this.auditService.log({
      tenantId: 'UNKNOWN', // Antes de autenticar
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

### **5. Integrar com MessagesService**

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

### **6. Job de Monitoramento** (Fase 4)

Criar `src/modules/audit/audit.monitor.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma.service';
import { AuditStatus } from 'prisma/generated/enums';

@Injectable()
export class AuditMonitor {
  private readonly logger = new Logger(AuditMonitor.name);

  constructor(private prisma: PrismaService) {}

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
      this.logger.warn(`🚨 ALERTA: ${failures} falhas detectadas nos últimos 5 minutos`);
      // TODO: Enviar notificação
    }
  }

  @Cron('*/10 * * * *') // A cada 10 minutos
  async checkMediaDownloadFailures() {
    const last10Minutes = new Date(Date.now() - 10 * 60 * 1000);
    
    const mediaFailures = await this.prisma.auditLog.count({
      where: {
        module: 'whatsapp',
        action: 'media.download',
        status: AuditStatus.FAILED,
        createdAt: { gte: last10Minutes },
      },
    });
    
    if (mediaFailures > 5) {
      this.logger.warn(`🚨 ALERTA: ${mediaFailures} falhas de download de mídia nos últimos 10 minutos`);
    }
  }
}
```

### **7. Job de Limpeza** (Fase 4)

Criar `src/modules/audit/audit.cleanup.job.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma.service';
import { AuditStatus } from 'prisma/generated/enums';

@Injectable()
export class AuditCleanupJob {
  private readonly logger = new Logger(AuditCleanupJob.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupOldLogs() {
    // Manter apenas últimos 90 dias
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);
    
    const deleted = await this.prisma.auditLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        status: AuditStatus.SUCCESS, // Manter falhas por mais tempo
      },
    });
    
    this.logger.log(`🧹 Deleted ${deleted.count} old audit logs`);
  }
}
```

### **8. Atualizar AuditModule com Jobs**

```typescript
// src/modules/audit/audit.module.ts
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { AuditMonitor } from './audit.monitor';
import { AuditCleanupJob } from './audit.cleanup.job';
import { PrismaService } from '../../prisma.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [
    AuditService,
    AuditMonitor,
    AuditCleanupJob,
    PrismaService
  ],
  controllers: [AuditController],
  exports: [AuditService],
})
export class AuditModule {}
```

### **9. Injetar AuditService nos Módulos**

Adicionar `AuditModule` aos imports de:
- `WhatsappModule`
- `MessagesModule`
- `AuthModule`

---

## 📝 Checklist Final

### **Para Completar Fase 2:**
- [ ] Injetar AuditService no WhatsappProcessor
- [ ] Adicionar logs em handleIncomingMessage (sucesso/falha)
- [ ] Adicionar logs em downloadAndSaveMedia
- [ ] Injetar AuditService no MessagesService
- [ ] Adicionar logs em create (mensagem enviada)
- [ ] Injetar AuditService no AuthController
- [ ] Adicionar logs em login (sucesso/falha)

### **Para Completar Fase 4:**
- [ ] Criar AuditMonitor
- [ ] Criar AuditCleanupJob
- [ ] Registrar jobs no AuditModule
- [ ] Testar alertas de anomalias
- [ ] Testar limpeza automática

---

## 🧪 Como Testar

### **1. Testar API de Logs:**
```bash
GET /audit/logs?limit=10
GET /audit/logs?eventType=MESSAGE&status=FAILED
GET /audit/stats?startDate=2025-12-22T00:00:00Z&endDate=2025-12-23T00:00:00Z
```

### **2. Gerar Eventos para Auditoria:**
- Enviar mensagem no WhatsApp
- Fazer upload de mídia
- Fazer login/logout
- Forçar erro (login com senha errada)

### **3. Verificar Logs no Prisma Studio:**
```bash
npx prisma studio
# Ir em audit_logs
```

---

**Próximo Passo:** Implementar integrações da Fase 2!
