# Eventos WebSocket - Documentação

Esta documentação descreve todos os eventos WebSocket disponíveis na API para comunicação em tempo real com o frontend.

## Configuração do Cliente

### Instalação
```bash
npm install socket.io-client
```

### Conexão com Autenticação
```javascript
import io from 'socket.io-client';

// Conectar ao WebSocket com autenticação JWT
const socket = io('http://localhost:3000', {
  query: { 
    token: 'SEU_JWT_TOKEN_AQUI' 
  }
});

// Verificar conexão
socket.on('connect', () => {
  console.log('✅ Conectado ao WebSocket!');
  console.log('Socket ID:', socket.id);
});

socket.on('disconnect', () => {
  console.log('❌ Desconectado do WebSocket');
});

socket.on('connect_error', (error) => {
  console.error('Erro na conexão:', error.message);
});
```

## Eventos Disponíveis

### 1. Mensagens

#### `new-message`
Disparado quando uma nova mensagem é recebida no WhatsApp.

**Payload:**
```typescript
{
  id: string;
  conversationId: string;
  providerId: string;
  content: string;
  mediaId?: string;
  metadata?: object;
  senderType: 'CONTACT' | 'USER' | 'SYSTEM';
  senderContactId?: string;
  senderUserId?: string;
  quotedMessageId?: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
  senderContact?: {
    id: string;
    name: string;
    phoneNumber: string;
    profilePicUrl?: string;
  };
  media?: {
    id: string;
    filename: string;
    mimeType: string;
    size: number;
    url: string;
  };
}
```

**Exemplo de uso:**
```javascript
socket.on('new-message', (message) => {
  console.log('Nova mensagem recebida:', message);
  
  // Atualizar interface
  addMessageToConversation(message.conversationId, message);
  
  // Tocar som de notificação
  if (!message.read) {
    playNotificationSound();
  }
  
  // Exibir notificação desktop
  if (Notification.permission === 'granted') {
    new Notification('Nova mensagem', {
      body: message.content,
      icon: message.senderContact?.profilePicUrl || '/default-avatar.png'
    });
  }
});
```

---

### 2. Status do WhatsApp

#### `whatsapp:connecting`
Disparado quando uma sessão do WhatsApp está iniciando a conexão.

**Payload:**
```typescript
{
  channelId: string;
  status: 'CONNECTING';
  timestamp: string; // ISO 8601
}
```

**Exemplo de uso:**
```javascript
socket.on('whatsapp:connecting', (data) => {
  console.log(`Canal ${data.channelId} está conectando...`);
  
  // Atualizar UI
  updateChannelStatus(data.channelId, 'Conectando...');
  showLoadingIndicator(data.channelId);
});
```

---

#### `whatsapp:qrcode`
Disparado quando um QR Code é gerado ou atualizado.

**Payload:**
```typescript
{
  channelId: string;
  qrCode: string; // Data URL (data:image/png;base64,...)
  timestamp: string; // ISO 8601
}
```

**Exemplo de uso:**
```javascript
socket.on('whatsapp:qrcode', (data) => {
  console.log(`QR Code gerado para canal ${data.channelId}`);
  
  // Exibir QR Code na interface
  const imgElement = document.getElementById(`qr-${data.channelId}`);
  imgElement.src = data.qrCode;
  
  // Mostrar modal com QR Code
  showQrCodeModal(data.channelId, data.qrCode);
});
```

---

#### `whatsapp:connected`
Disparado quando a conexão do WhatsApp é estabelecida com sucesso.

**Payload:**
```typescript
{
  channelId: string;
  status: 'CONNECTED';
  identifier: string; // Número do WhatsApp conectado
  timestamp: string; // ISO 8601
}
```

**Exemplo de uso:**
```javascript
socket.on('whatsapp:connected', (data) => {
  console.log(`✅ Canal ${data.channelId} conectado!`);
  console.log(`Número: ${data.identifier}`);
  
  // Atualizar UI
  updateChannelStatus(data.channelId, 'Conectado');
  hideQrCodeModal(data.channelId);
  showSuccessMessage(`WhatsApp ${data.identifier} conectado com sucesso!`);
  
  // Atualizar badge/ícone
  setChannelOnline(data.channelId);
});
```

---

#### `whatsapp:disconnected`
Disparado quando a conexão do WhatsApp é encerrada.

**Payload:**
```typescript
{
  channelId: string;
  status: 'DISCONNECTED';
  reason: 'connection_lost' | 'logged_out' | 'manual_logout';
  timestamp: string; // ISO 8601
}
```

**Exemplo de uso:**
```javascript
socket.on('whatsapp:disconnected', (data) => {
  console.log(`❌ Canal ${data.channelId} desconectado`);
  console.log(`Motivo: ${data.reason}`);
  
  // Atualizar UI baseado no motivo
  switch (data.reason) {
    case 'manual_logout':
      updateChannelStatus(data.channelId, 'Desconectado');
      showInfoMessage('WhatsApp desconectado com sucesso');
      break;
      
    case 'logged_out':
      updateChannelStatus(data.channelId, 'Sessão encerrada');
      showWarningMessage('Sessão do WhatsApp foi encerrada. Reconecte escaneando o QR Code.');
      break;
      
    case 'connection_lost':
      updateChannelStatus(data.channelId, 'Tentando reconectar...');
      showWarningMessage('Conexão perdida. Tentando reconectar...');
      break;
  }
  
  // Atualizar badge/ícone
  setChannelOffline(data.channelId);
});
```

---

#### `whatsapp:reconnecting`
Disparado quando o sistema está tentando reconectar uma sessão perdida.

**Payload:**
```typescript
{
  channelId: string;
  status: 'RECONNECTING';
  timestamp: string; // ISO 8601
}
```

**Exemplo de uso:**
```javascript
socket.on('whatsapp:reconnecting', (data) => {
  console.log(`🔄 Canal ${data.channelId} tentando reconectar...`);
  
  // Atualizar UI
  updateChannelStatus(data.channelId, 'Reconectando...');
  showLoadingIndicator(data.channelId);
  
  // Mostrar notificação temporária
  showInfoMessage('Reconectando ao WhatsApp...', 3000);
});
```

---

## Exemplo Completo de Implementação

```javascript
import io from 'socket.io-client';

class WhatsAppSocketManager {
  constructor(apiUrl, token) {
    this.socket = io(apiUrl, {
      query: { token }
    });
    
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    // Conexão
    this.socket.on('connect', () => {
      console.log('✅ WebSocket conectado');
    });
    
    this.socket.on('disconnect', () => {
      console.log('❌ WebSocket desconectado');
    });
    
    // Mensagens
    this.socket.on('new-message', this.handleNewMessage.bind(this));
    
    // Status do WhatsApp
    this.socket.on('whatsapp:connecting', this.handleConnecting.bind(this));
    this.socket.on('whatsapp:qrcode', this.handleQrCode.bind(this));
    this.socket.on('whatsapp:connected', this.handleConnected.bind(this));
    this.socket.on('whatsapp:disconnected', this.handleDisconnected.bind(this));
    this.socket.on('whatsapp:reconnecting', this.handleReconnecting.bind(this));
  }
  
  handleNewMessage(message) {
    console.log('Nova mensagem:', message);
    // Sua lógica aqui
  }
  
  handleConnecting(data) {
    console.log('Conectando:', data);
    // Sua lógica aqui
  }
  
  handleQrCode(data) {
    console.log('QR Code:', data);
    // Sua lógica aqui
  }
  
  handleConnected(data) {
    console.log('Conectado:', data);
    // Sua lógica aqui
  }
  
  handleDisconnected(data) {
    console.log('Desconectado:', data);
    // Sua lógica aqui
  }
  
  handleReconnecting(data) {
    console.log('Reconectando:', data);
    // Sua lógica aqui
  }
  
  disconnect() {
    this.socket.disconnect();
  }
}

// Uso
const wsManager = new WhatsAppSocketManager(
  'http://localhost:3000',
  localStorage.getItem('jwt_token')
);
```

## Exemplo com React

```jsx
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

function useWhatsAppSocket(token) {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [channelStatus, setChannelStatus] = useState({});
  
  useEffect(() => {
    const newSocket = io('http://localhost:3000', {
      query: { token }
    });
    
    newSocket.on('new-message', (message) => {
      setMessages((prev) => [...prev, message]);
    });
    
    newSocket.on('whatsapp:qrcode', (data) => {
      setChannelStatus((prev) => ({
        ...prev,
        [data.channelId]: { status: 'qrcode', qrCode: data.qrCode }
      }));
    });
    
    newSocket.on('whatsapp:connected', (data) => {
      setChannelStatus((prev) => ({
        ...prev,
        [data.channelId]: { status: 'connected', identifier: data.identifier }
      }));
    });
    
    newSocket.on('whatsapp:disconnected', (data) => {
      setChannelStatus((prev) => ({
        ...prev,
        [data.channelId]: { status: 'disconnected', reason: data.reason }
      }));
    });
    
    setSocket(newSocket);
    
    return () => {
      newSocket.disconnect();
    };
  }, [token]);
  
  return { socket, messages, channelStatus };
}

// Componente
function WhatsAppDashboard() {
  const token = localStorage.getItem('jwt_token');
  const { messages, channelStatus } = useWhatsAppSocket(token);
  
  return (
    <div>
      <h1>WhatsApp Dashboard</h1>
      
      {/* Status dos canais */}
      {Object.entries(channelStatus).map(([channelId, status]) => (
        <div key={channelId}>
          <h3>Canal: {channelId}</h3>
          <p>Status: {status.status}</p>
          {status.qrCode && <img src={status.qrCode} alt="QR Code" />}
        </div>
      ))}
      
      {/* Mensagens */}
      <div>
        <h2>Mensagens</h2>
        {messages.map((msg) => (
          <div key={msg.id}>
            <p>{msg.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Segurança

1. **Autenticação**: Todos os clientes devem se autenticar com um JWT válido
2. **Isolamento Multi-Tenant**: Clientes só recebem eventos do seu próprio tenant
3. **CORS**: Configure adequadamente o CORS em produção (não use `'*'`)

## Troubleshooting

### Cliente não consegue conectar
- Verifique se o token JWT é válido
- Verifique se o servidor está rodando
- Verifique configurações de CORS
- Verifique firewall/proxy

### Eventos não estão sendo recebidos
- Verifique se o tenantId está correto no token JWT
- Verifique os logs do servidor
- Verifique se os event listeners estão configurados antes da conexão

### Múltiplas conexões
- Garanta que você está desconectando o socket quando o componente desmontar (React)
- Use um singleton para gerenciar a conexão do socket
