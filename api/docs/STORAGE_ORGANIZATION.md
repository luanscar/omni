# 📁 Organização de Storage Implementada

## ✅ Status: **IMPLEMENTADO**

Data: 2025-12-22

---

## 📂 Estrutura de Pastas

```
/storage/
├── tenant-{uuid-1}/
│   ├── messages/           # Mídias de mensagens WhatsApp
│   │   ├── images/
│   │   │   └── abc-123-def.jpg
│   │   ├── videos/
│   │   │   └── def-456-ghi.mp4
│   │   ├── audios/
│   │   │   └── ghi-789-jkl.ogg
│   │   ├── documents/
│   │   │   └── jkl-012-mno.pdf
│   │   └── others/
│   │       └── mno-345-pqr.bin
│   │
│   ├── avatars/            # Fotos de perfil (contatos/usuários)
│   │   └── images/
│   │       └── profile_557981551697.jpg
│   │
│   ├── documents/          # Documentos gerais (padrão)
│   │   ├── documents/
│   │   ├── spreadsheets/
│   │   └── text/
│   │
│   ├── exports/            # Relatórios exportados
│   │   └── documents/
│   │
│   └── temp/               # Arquivos temporários
│       └── others/
│
├── tenant-{uuid-2}/
│   └── ...
```

---

## 🔧 Como Funciona

### **Categorias Disponíveis:**

| Categoria | Descrição | Uso |
|-----------|-----------|-----|
| `messages` | Mídias de mensagens WhatsApp | Automático no WhatsappProcessor |
| `avatars` | Fotos de perfil | Automático ao criar contatos |
| `documents` | Documentos gerais | **Padrão** - Upload manual |
| `exports` | Relatórios exportados | Futuro |
| `temp` | Arquivos temporários | Futuro |

### **Subcategorias (automáticas por MIME type):**

| MIME Type | Subcategoria |
|-----------|--------------|
| `image/*` | `images` |
| `video/*` | `videos` |
| `audio/*` | `audios` |
| `application/pdf` | `documents` |
| `application/*document*` | `documents` |
| `*spreadsheet*` | `spreadsheets` |
| `text/*` | `text` |
| Outros | `others` |

---

## 📝 Exemplos de Uso

### **1. Upload Manual com Categoria**

```bash
POST /storage/upload?category=documents
Content-Type: multipart/form-data

file: arquivo.pdf
```

**Resultado:**
```
Key: tenant-abc123/documents/documents/uuid.pdf
```

### **2. Upload de Mensagem WhatsApp (Automático)**

Quando uma imagem é recebida no WhatsApp:
```typescript
await storageService.uploadFile(file, tenantId, null, 'messages');
```

**Resultado:**
```
Key: tenant-abc123/messages/images/uuid.jpg
```

### **3. Upload em Lote com Categoria**

```bash
POST /storage/upload/batch?category=exports
Content-Type: multipart/form-data

files: [relatorio1.pdf, relatorio2.xlsx]
```

**Resultado:**
```
relatorio1.pdf → tenant-abc123/exports/documents/uuid1.pdf
relatorio2.xlsx → tenant-abc123/exports/spreadsheets/uuid2.xlsx
```

### **4. Avatar de Contato (Automático)**

Quando um contato é criado e foto de perfil baixada:
```typescript
await storageService.uploadFile(avatarFile, tenantId, null, 'avatars');
```

**Resultado:**
```
Key: tenant-abc123/avatars/images/profile_557981551697.jpg
```

---

## 🔑 Modificações Realizadas

### **1. StorageService (`storage.service.ts`)**

✅ Adicionado parâmetro `category` opcional (padrão: `'documents'`)
✅ Criado método `getSubCategoryByMimeType()` 
✅ Estrutura de key: `tenant-{uuid}/{category}/{subCategory}/{fileName}`

### **2. StorageController (`storage.controller.ts`)**

✅ Adicionado query param `?category` em `/upload`
✅ Adicionado query param `?category` em `/upload/batch`
✅ Import do decorator `Query`

### **3. WhatsappProcessor (`whatsapp.processor.ts`)**

✅ Mídias de mensagens → `category: 'messages'`
✅ Fotos de perfil → `category: 'avatars'`

---

## 📊 Benefícios

✅ **Organização clara** - Fácil encontrar arquivos por tipo
✅ **Escalabilidade** - Estrutura hierárquica sustentável
✅ **Multi-tenant isolado** - Cada tenant tem sua pasta
✅ **Análise facilitada** - Saber uso por categoria
✅ **Backup seletivo** - Fazer backup apenas de messages, por exemplo
✅ **Limpeza eficiente** - Limpar temp/ periodicamente

---

## 🔄 Migração de Arquivos Antigos (Opcional)

Arquivos antigos criados antes desta implementação estão em:
```
/storage/{tenantId}/{fileName}
```

Para migrar (futuro):
1. Criar script de migração
2. Ler key antiga do banco
3. Mover para nova estrutura
4. Atualizar campo `key` no banco

---

## 📈 Próximos Passos

- [ ] Adicionar campo `category` na tabela `Media` (opcional, para queries)
- [ ] Job para limpar pasta `temp/` periodicamente
- [ ] Dashboard mostrando uso por categoria
- [ ] API para mover arquivos entre categorias
- [ ] Validação de categoria (enum)

---

## 🎯 Uso Recomendado

### **Frontend deve especificar categoria:**

```tsx
// Upload de documento geral
const formData = new FormData();
formData.append('file', file);
await fetch('/storage/upload?category=documents', { 
  method: 'POST', 
  body: formData 
});

// Upload de relatório
await fetch('/storage/upload?category=exports', { 
  method: 'POST', 
  body: formData 
});
```

### **Backend automático:**

- WhatsApp mídias → `messages`
- Avatars → `avatars`
- Outros uploads → `documents` (padrão)

---

**Implementado por:** Sistema Omni  
**Versão:** 1.0  
**Última atualização:** 2025-12-22
