# 📤 Guia: Upload e Envio em Lote

## Fluxo Completo - Enviar Múltiplas Fotos

### **Passo 1: Upload em Lote**

```bash
POST /storage/upload/batch
Content-Type: multipart/form-data

files: [foto1.jpg, foto2.jpg, foto3.jpg]
```

**Resposta:**
```json
[
  {
    "id": "abc-123",
    "fileName": "foto1.jpg",
    "mimeType": "image/jpeg",
    "size": 245678
  },
  {
    "id": "def-456",
    "fileName": "foto2.jpg",
    "mimeType": "image/jpeg",
    "size": 189234
  },
  {
    "id": "ghi-789",
    "fileName": "foto3.jpg",
    "mimeType": "image/jpeg",
    "size": 321456
  }
]
```

### **Passo 2: Enviar Mensagens em Lote**

```bash
POST /messages/batch
Content-Type: application/json

{
  "conversationId": "uuid-da-conversa",
  "messages": [
    {
      "type": "IMAGE",
      "mediaId": "abc-123",
      "content": "Primeira foto"
    },
    {
      "type": "IMAGE",
      "mediaId": "def-456",
      "content": "Segunda foto"
    },
    {
      "type": "IMAGE",
      "mediaId": "ghi-789",
      "content": "Terceira foto"
    }
  ]
}
```

**Resultado:** 3 mensagens enviadas! 📸📸📸

---

## Exemplo Frontend (JavaScript)

```javascript
// 1. Upload de múltiplos arquivos
const files = document.querySelector('input[type="file"]').files;

const formData = new FormData();
for (const file of files) {
  formData.append('files', file);
}

const uploadResponse = await fetch('/storage/upload/batch', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});

const medias = await uploadResponse.json();

// 2. Preparar mensagens
const messages = medias.map((media, index) => ({
  type: 'IMAGE',
  mediaId: media.id,
  content: `Foto ${index + 1}`
}));

// 3. Enviar em lote
const sendResponse = await fetch('/messages/batch', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    conversationId: 'uuid-da-conversa',
    messages: messages
  })
});

const sentMessages = await sendResponse.json();
console.log(`${sentMessages.length} mensagens enviadas!`);
```

---

## Exemplo com Progress Bar

```javascript
async function uploadAndSendMultiple(files, conversationId) {
  const totalFiles = files.length;
  
  // Upload com progress
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));
  
  updateProgress(0, 'Fazendo upload...');
  const medias = await fetch('/storage/upload/batch', {
    method: 'POST',
    body: formData
  }).then(r => r.json());
  
  updateProgress(50, 'Upload concluído! Enviando mensagens...');
  
  // Enviar mensagens
  const messages = medias.map(m => ({
    type: 'IMAGE',
    mediaId: m.id
  }));
  
  const sent = await fetch('/messages/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversationId, messages })
  }).then(r => r.json());
  
  updateProgress(100, `${sent.length} mensagens enviadas!`);
}
```

---

## Casos de Uso

### ✅ Álbum de Fotos
```json
{
  "conversationId": "uuid",
  "messages": [
    { "type": "IMAGE", "mediaId": "1" },
    { "type": "IMAGE", "mediaId": "2" },
    { "type": "IMAGE", "mediaId": "3" }
  ]
}
```

### ✅ Documentos PDF
```json
{
  "conversationId": "uuid",
  "messages": [
    { "type": "DOCUMENT", "mediaId": "1", "content": "Contrato.pdf" },
    { "type": "DOCUMENT", "mediaId": "2", "content": "Anexo1.pdf" },
    { "type": "DOCUMENT", "mediaId": "3", "content": "Anexo2.pdf" }
  ]
}
```

### ✅ Mix de Tipos
```json
{
  "conversationId": "uuid",
  "messages": [
    { "type": "TEXT", "content": "Seguem os arquivos:" },
    { "type": "IMAGE", "mediaId": "1", "content": "Foto do produto" },
    { "type": "DOCUMENT", "mediaId": "2", "content": "Catálogo.pdf" }
  ]
}
```
