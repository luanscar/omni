# 📁 Sistema de Drive por Tenant - Planejamento Futuro

> **Status:** Planejado (Não Implementado)  
> **Prioridade:** Média  
> **Estimativa:** 2-3 semanas  

## 🎯 Objetivo

Implementar um sistema de armazenamento (Drive) para cada tenant, similar ao Google Drive, com:
- Controle de quota por plano
- Organização hierárquica de arquivos
- Estatísticas de uso
- Sistema de upgrade de planos

---

## 📊 1. Estrutura de Banco de Dados

### **Modelo Tenant ATUAL (NÃO MODIFICAR):**

```prisma
model Tenant {
  id        String   @id @default(uuid())
  name      String
  slug      String   @unique
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  users         User[]
  contacts      Contact[]
  channels      Channel[]
  teams         Team[]
  medias        Media[]
  conversations Conversation[]

  @@map("tenants")
}
```

### **CAMPOS NOVOS a serem ADICIONADOS:**

```prisma
model Tenant {
  // ... campos existentes acima (não modificar)
  
  // NOVOS CAMPOS para sistema de Drive:
  storageQuotaBytes BigInt   @default(1073741824) // 1GB padrão
  storageUsedBytes  BigInt   @default(0)
  plan              PlanType @default(FREE)
}

// NOVO ENUM
enum PlanType {
  FREE       // 1GB
  BASIC      // 5GB  - R$ 29/mês
  PRO        // 20GB - R$ 79/mês
  BUSINESS   // 100GB - R$ 199/mês
  ENTERPRISE // Ilimitado - Personalizado
}

// NOVA TABELA para histórico de uso
model StorageHistory {
  id          String   @id @default(uuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  usedBytes   BigInt
  fileCount   Int
  date        DateTime @default(now())
  
  @@map("storage_history")
  @@index([tenantId, date])
}
```

### **⚠️ IMPORTANTE:**
- **NÃO remover** campos existentes do Tenant
- **NÃO renomear** campos existentes
- **APENAS ADICIONAR** os 3 novos campos: `storageQuotaBytes`, `storageUsedBytes`, `plan`
- Criar o novo enum `PlanType`
- Criar a nova tabela `StorageHistory`

---

## 📂 2. Organização de Arquivos no Storage

### **Estrutura de Pastas**

```
/storage/
├── tenant-{uuid-1}/
│   ├── messages/           # Mídias de mensagens do WhatsApp
│   │   ├── images/
│   │   ├── videos/
│   │   ├── audios/
│   │   ├── documents/
│   │   └── stickers/
│   ├── documents/          # Documentos gerais do tenant
│   ├── avatars/            # Fotos de perfil (usuários, contatos)
│   ├── exports/            # Relatórios exportados
│   └── temp/               # Arquivos temporários
├── tenant-{uuid-2}/
│   └── ...
```

### **Convenção de Nomenclatura**

```
{timestamp}_{uuid}_{original-name}
Exemplo: 1734840000_abc123_foto.jpg
```

---

## 🔧 3. Implementação Técnica

### **3.1. StorageService - Verificação de Quota**

```typescript
// src/modules/storage/storage.service.ts

async uploadFile(file: MultipartFile, tenantId: string, userId: string) {
  // 1. Verificar quota disponível
  const tenant = await this.prisma.tenant.findUnique({ 
    where: { id: tenantId },
    select: {
      storageQuotaBytes: true,
      storageUsedBytes: true,
      plan: true
    }
  });
  
  if (!tenant) {
    throw new NotFoundException('Tenant não encontrado');
  }
  
  const availableBytes = tenant.storageQuotaBytes - tenant.storageUsedBytes;
  const fileSize = file.file.bytesRead; // ou file.size
  
  if (fileSize > availableBytes) {
    throw new BadRequestException({
      message: 'Quota de armazenamento excedida',
      used: tenant.storageUsedBytes,
      quota: tenant.storageQuotaBytes,
      required: fileSize,
      available: availableBytes,
      plan: tenant.plan
    });
  }
  
  // 2. Upload do arquivo (lógica existente)
  const media = await this.saveFile(file, tenantId);
  
  // 3. Atualizar uso de armazenamento
  await this.prisma.tenant.update({
    where: { id: tenantId },
    data: {
      storageUsedBytes: {
        increment: fileSize
      }
    }
  });
  
  // 4. Registrar no histórico (opcional, para analytics)
  await this.recordStorageSnapshot(tenantId);
  
  // 5. Verificar se atingiu limites (80%, 90%, 100%)
  await this.checkStorageWarnings(tenantId);
  
  return media;
}

async remove(id: string, tenantId: string) {
  const media = await this.prisma.media.findFirst({
    where: { id, tenantId }
  });
  
  if (!media) {
    throw new NotFoundException('Arquivo não encontrado');
  }
  
  // Deletar arquivo físico
  await this.deletePhysicalFile(media.fileName);
  
  // Deletar do banco
  await this.prisma.media.delete({ where: { id } });
  
  // Decrementar uso
  await this.prisma.tenant.update({
    where: { id: tenantId },
    data: {
      storageUsedBytes: {
        decrement: media.size
      }
    }
  });
  
  return { message: 'Arquivo removido com sucesso' };
}
```

### **3.2. Endpoints de Estatísticas**

```typescript
// src/modules/storage/storage.controller.ts

@Get('stats')
@Roles(UserRole.ADMIN, UserRole.MANAGER)
@ApiOperation({ summary: 'Estatísticas de armazenamento do tenant' })
async getStats(@Request() req) {
  return this.storageService.getStorageStats(req.user.tenantId);
}

@Get('breakdown')
@Roles(UserRole.ADMIN, UserRole.MANAGER)
@ApiOperation({ summary: 'Detalhamento de uso por tipo de arquivo' })
async getBreakdown(@Request() req) {
  return this.storageService.getStorageBreakdown(req.user.tenantId);
}

@Get('largest-files')
@Roles(UserRole.ADMIN, UserRole.MANAGER)
@ApiOperation({ summary: 'Top 20 maiores arquivos' })
async getLargestFiles(@Request() req) {
  return this.storageService.getLargestFiles(req.user.tenantId, 20);
}
```

```typescript
// src/modules/storage/storage.service.ts

async getStorageStats(tenantId: string) {
  const tenant = await this.prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      storageQuotaBytes: true,
      storageUsedBytes: true,
      plan: true
    }
  });
  
  const fileCount = await this.prisma.media.count({
    where: { tenantId }
  });
  
  const availableBytes = tenant.storageQuotaBytes - tenant.storageUsedBytes;
  const usedPercent = (tenant.storageUsedBytes / tenant.storageQuotaBytes) * 100;
  
  return {
    quota: {
      bytes: tenant.storageQuotaBytes,
      formatted: this.formatBytes(tenant.storageQuotaBytes)
    },
    used: {
      bytes: tenant.storageUsedBytes,
      formatted: this.formatBytes(tenant.storageUsedBytes),
      percent: Math.round(usedPercent * 100) / 100
    },
    available: {
      bytes: availableBytes,
      formatted: this.formatBytes(availableBytes)
    },
    fileCount: fileCount,
    plan: tenant.plan
  };
}

async getStorageBreakdown(tenantId: string) {
  const breakdown = await this.prisma.media.groupBy({
    by: ['mimeType'],
    where: { tenantId },
    _count: true,
    _sum: {
      size: true
    }
  });
  
  // Agrupar por categoria
  const categories = {
    images: { count: 0, bytes: 0, mimeTypes: [] },
    videos: { count: 0, bytes: 0, mimeTypes: [] },
    audios: { count: 0, bytes: 0, mimeTypes: [] },
    documents: { count: 0, bytes: 0, mimeTypes: [] },
    others: { count: 0, bytes: 0, mimeTypes: [] }
  };
  
  for (const item of breakdown) {
    const category = this.categorizeByMimeType(item.mimeType);
    categories[category].count += item._count;
    categories[category].bytes += item._sum.size || 0;
    categories[category].mimeTypes.push(item.mimeType);
  }
  
  return categories;
}

private categorizeByMimeType(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'images';
  if (mimeType.startsWith('video/')) return 'videos';
  if (mimeType.startsWith('audio/')) return 'audios';
  if (mimeType.includes('pdf') || mimeType.includes('document')) return 'documents';
  return 'others';
}

private formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
```

---

## 💰 4. Sistema de Planos e Upgrade

### **4.1. Configuração de Planos**

```typescript
// src/modules/tenants/plans.config.ts

export const STORAGE_PLANS = {
  FREE: {
    name: 'Grátis',
    quotaBytes: 1 * 1024 * 1024 * 1024, // 1GB
    price: 0,
    features: [
      'Até 1GB de armazenamento',
      'Suporte por email',
      '1 canal WhatsApp'
    ]
  },
  BASIC: {
    name: 'Básico',
    quotaBytes: 5 * 1024 * 1024 * 1024, // 5GB
    price: 29.90,
    features: [
      'Até 5GB de armazenamento',
      'Suporte prioritário',
      '3 canais WhatsApp',
      'Relatórios básicos'
    ]
  },
  PRO: {
    name: 'Profissional',
    quotaBytes: 20 * 1024 * 1024 * 1024, // 20GB
    price: 79.90,
    features: [
      'Até 20GB de armazenamento',
      'Suporte 24/7',
      '10 canais WhatsApp',
      'Relatórios avançados',
      'API access'
    ]
  },
  BUSINESS: {
    name: 'Empresarial',
    quotaBytes: 100 * 1024 * 1024 * 1024, // 100GB
    price: 199.90,
    features: [
      'Até 100GB de armazenamento',
      'Suporte dedicado',
      'Canais ilimitados',
      'Analytics completo',
      'White label'
    ]
  },
  ENTERPRISE: {
    name: 'Corporativo',
    quotaBytes: Number.MAX_SAFE_INTEGER, // Ilimitado
    price: null, // Personalizado
    features: [
      'Armazenamento ilimitado',
      'Gerente de conta dedicado',
      'SLA garantido',
      'Customizações',
      'Integração sob demanda'
    ]
  }
};
```

### **4.2. Endpoint de Upgrade**

```typescript
// src/modules/tenants/tenants.controller.ts

@Patch('plan')
@Roles(UserRole.ADMIN)
@ApiOperation({ summary: 'Atualizar plano do tenant' })
async upgradePlan(
  @Body() upgradePlanDto: UpgradePlanDto,
  @Request() req
) {
  return this.tenantsService.upgradePlan(
    req.user.tenantId,
    upgradePlanDto.plan
  );
}
```

```typescript
// src/modules/tenants/tenants.service.ts

async upgradePlan(tenantId: string, newPlan: PlanType) {
  const planConfig = STORAGE_PLANS[newPlan];
  
  if (!planConfig) {
    throw new BadRequestException('Plano inválido');
  }
  
  const tenant = await this.prisma.tenant.findUnique({
    where: { id: tenantId }
  });
  
  // Verificar se não é downgrade com dados excedendo nova quota
  if (planConfig.quotaBytes < tenant.storageUsedBytes) {
    throw new BadRequestException(
      'Não é possível fazer downgrade. ' +
      'Você está usando mais espaço do que o novo plano permite. ' +
      'Por favor, remova alguns arquivos primeiro.'
    );
  }
  
  await this.prisma.tenant.update({
    where: { id: tenantId },
    data: {
      plan: newPlan,
      storageQuotaBytes: planConfig.quotaBytes
    }
  });
  
  // TODO: Integrar com sistema de pagamentos
  
  return {
    message: 'Plano atualizado com sucesso',
    plan: newPlan,
    newQuota: planConfig.quotaBytes
  };
}
```

---

## 🔔 5. Sistema de Notificações de Quota

```typescript
// src/modules/storage/storage.service.ts

async checkStorageWarnings(tenantId: string) {
  const tenant = await this.prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      storageQuotaBytes: true,
      storageUsedBytes: true,
      plan: true
    }
  });
  
  const usedPercent = (tenant.storageUsedBytes / tenant.storageQuotaBytes) * 100;
  
  if (usedPercent >= 100) {
    await this.notificationService.send(tenantId, {
      type: 'STORAGE_FULL',
      title: 'Armazenamento Cheio',
      message: 'Seu armazenamento está 100% cheio. Novos uploads serão bloqueados.',
      severity: 'error',
      action: {
        label: 'Fazer Upgrade',
        url: '/settings/plan'
      }
    });
  } else if (usedPercent >= 90) {
    await this.notificationService.send(tenantId, {
      type: 'STORAGE_WARNING_90',
      title: 'Armazenamento Quase Cheio',
      message: 'Você está usando 90% do seu armazenamento. Considere fazer upgrade do plano.',
      severity: 'warning'
    });
  } else if (usedPercent >= 80) {
    await this.notificationService.send(tenantId, {
      type: 'STORAGE_WARNING_80',
      title: 'Armazenamento em 80%',
      message: 'Você está usando 80% do seu armazenamento.',
      severity: 'info'
    });
  }
}
```

---

## 🧹 6. Job de Limpeza de Arquivos Órfãos

```typescript
// src/modules/storage/jobs/cleanup-orphan-files.job.ts

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CleanupOrphanFilesJob {
  private readonly logger = new Logger(CleanupOrphanFilesJob.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleCron() {
    this.logger.log('Iniciando limpeza de arquivos órfãos...');
    
    const tenants = await this.prisma.tenant.findMany({
      select: { id: true }
    });
    
    for (const tenant of tenants) {
      await this.cleanTenantOrphanFiles(tenant.id);
    }
    
    this.logger.log('Limpeza concluída');
  }

  private async cleanTenantOrphanFiles(tenantId: string) {
    const tenantDir = path.join(process.cwd(), 'storage', tenantId);
    
    if (!fs.existsSync(tenantDir)) {
      return;
    }
    
    // Listar arquivos registrados no banco
    const mediaRecords = await this.prisma.media.findMany({
      where: { tenantId },
      select: { fileName: true }
    });
    
    const registeredFiles = new Set(mediaRecords.map(m => m.fileName));
    
    // Escanear arquivos físicos
    const physicalFiles = this.scanDirectory(tenantDir);
    
    let deletedCount = 0;
    let freedBytes = 0;
    
    for (const filePath of physicalFiles) {
      const fileName = path.basename(filePath);
      
      if (!registeredFiles.has(fileName)) {
        try {
          const stats = fs.statSync(filePath);
          fs.unlinkSync(filePath);
          deletedCount++;
          freedBytes += stats.size;
          this.logger.log(`Órfão removido: ${fileName}`);
        } catch (err) {
          this.logger.error(`Erro ao remover ${fileName}: ${err.message}`);
        }
      }
    }
    
    if (deletedCount > 0) {
      this.logger.log(
        `Tenant ${tenantId}: ${deletedCount} arquivos órfãos removidos, ` +
        `${(freedBytes / 1024 / 1024).toFixed(2)}MB liberados`
      );
    }
  }

  private scanDirectory(dir: string): string[] {
    const files: string[] = [];
    
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stats = fs.statSync(fullPath);
      
      if (stats.isDirectory()) {
        files.push(...this.scanDirectory(fullPath));
      } else {
        files.push(fullPath);
      }
    }
    
    return files;
  }
}
```

---

## 📈 7. Dashboard de Gerenciamento (Frontend)

### **Componentes UI Necessários**

```tsx
// StorageDashboard.tsx

- Barra de progresso visual (quota)
- Card com estatísticas (usado/disponível/total)
- Gráfico pizza por tipo de arquivo
- Lista de arquivos maiores (top 20)
- Botão de upgrade de plano
- Histórico de uso (gráfico de linha)
- Filtros por tipo/data
- Busca de arquivos
```

### **Mockup**

```
┌──────────────────────────────────────────────────┐
│  📁 Armazenamento                        [UPGRADE]│
├──────────────────────────────────────────────────┤
│                                                  │
│  Plano Atual: PRO                                │
│  ██████████████████░░░░░  15GB / 20GB (75%)      │
│                                                  │
│  ┌────────────┬────────────┬────────────┐        │
│  │ 📸 Imagens │ 🎥 Vídeos  │ 📄 Docs    │        │
│  │   8.5GB    │   4.2GB    │   2.3GB    │        │
│  └────────────┴────────────┴────────────┘        │
│                                                  │
│  📊 Maiores Arquivos:                            │
│  1. video_backup.mp4 ................ 1.2GB      │
│  2. presentation.pptx ............... 450MB      │
│  3. database_export.sql ............. 380MB      │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

## ✅ Checklist de Implementação

### **Fase 1: Base**
- [ ] Adicionar campos `storageQuotaBytes`, `storageUsedBytes`, `plan` no Tenant
- [ ] Criar enum `PlanType`
- [ ] Migração do banco de dados
- [ ] Organizar estrutura de pastas por tenant

### **Fase 2: Controle de Quota**
- [ ] Implementar verificação de quota no upload
- [ ] Atualizar uso ao fazer upload
- [ ] Decrementar uso ao deletar arquivo
- [ ] Bloquear upload quando quota cheia

### **Fase 3: Estatísticas**
- [ ] Endpoint `GET /storage/stats`
- [ ] Endpoint `GET /storage/breakdown`
- [ ] Endpoint `GET /storage/largest-files`
- [ ] Helper para formatar bytes

### **Fase 4: Planos**
- [ ] Configurar planos e preços
- [ ] Endpoint `PATCH /tenants/plan`
- [ ] Validação de downgrade
- [ ] Integração com gateway de pagamento (Stripe/PagSeguro)

### **Fase 5: Notificações**
- [ ] Sistema de notificações (80%, 90%, 100%)
- [ ] Email alerts
- [ ] Notificações in-app

### **Fase 6: Manutenção**
- [ ] Job de limpeza de órfãos (cron)
- [ ] Registro de histórico de uso
- [ ] Logs de operações de storage

### **Fase 7: Frontend**
- [ ] Dashboard de armazenamento
- [ ] Gráficos e estatísticas
- [ ] Página de gerenciamento de planos
- [ ] Modal de upgrade

---

## 🎯 Métricas de Sucesso

- **Performance:** Upload/download < 2s para arquivos até 10MB
- **Precisão:** Uso de storage com margem de erro < 1%
- **Disponibilidade:** 99.9% uptime do storage
- **Conversão:** Taxa de upgrade > 10%

---

## 🔗 Referências

- [AWS S3 Best Practices](https://docs.aws.amazon.com/s3/)
- [Google Drive API](https://developers.google.com/drive)
- [Stripe Subscriptions](https://stripe.com/docs/billing/subscriptions)

---

**Última Atualização:** 2025-12-22  
**Versão:** 1.0  
**Autor:** Equipe de Desenvolvimento
