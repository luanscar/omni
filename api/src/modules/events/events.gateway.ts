import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*', // Em produção, restrinja para o domínio do seu frontend
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('EventsGateway');

  constructor(private jwtService: JwtService) { }

  async handleConnection(client: Socket) {
    try {
      // O frontend deve enviar o token assim: io('...', { query: { token: 'JWT' } })
      const token = client.handshake.query.token as string;

      if (!token) {
        this.logger.warn(`Client ${client.id} tried to connect without token`);
        client.disconnect();
        return;
      }

      // Valida o token e extrai o tenantId
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'super-secret-key-change-this',
      });

      // Adiciona o socket à sala do Tenant específico
      const roomName = `tenant-${payload.tenantId}`;
      await client.join(roomName);

      this.logger.log(`Client ${client.id} joined room: ${roomName}`);
    } catch (error) {
      this.logger.error(`Connection rejected: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Método público para outros módulos (ex: WhatsappProcessor) enviarem eventos
  emitNewMessage(tenantId: string, message: any) {
    const roomName = `tenant-${tenantId}`;
    this.server.to(roomName).emit('new-message', message);
  }

  emitMessageUpdated(tenantId: string, message: any) {
    const roomName = `tenant-${tenantId}`;
    this.server.to(roomName).emit('message-updated', message);
  }

  // Eventos do WhatsApp - Status da Conexão
  emitWhatsappQrCode(tenantId: string, channelId: string, qrCode: string) {
    const roomName = `tenant-${tenantId}`;
    this.logger.log(`Emitting QR Code for channel ${channelId} to ${roomName}`);
    this.server.to(roomName).emit('whatsapp:qrcode', {
      channelId,
      qrCode,
      timestamp: new Date().toISOString(),
    });
  }

  emitWhatsappConnected(tenantId: string, channelId: string, data?: any) {
    const roomName = `tenant-${tenantId}`;
    this.logger.log(`Emitting WhatsApp connected for channel ${channelId} to ${roomName}`);
    this.server.to(roomName).emit('whatsapp:connected', {
      channelId,
      status: 'CONNECTED',
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  emitWhatsappDisconnected(tenantId: string, channelId: string, reason?: string) {
    const roomName = `tenant-${tenantId}`;
    this.logger.log(`Emitting WhatsApp disconnected for channel ${channelId} to ${roomName}`);
    this.server.to(roomName).emit('whatsapp:disconnected', {
      channelId,
      status: 'DISCONNECTED',
      reason,
      timestamp: new Date().toISOString(),
    });
  }

  emitWhatsappReconnecting(tenantId: string, channelId: string) {
    const roomName = `tenant-${tenantId}`;
    this.logger.log(`Emitting WhatsApp reconnecting for channel ${channelId} to ${roomName}`);
    this.server.to(roomName).emit('whatsapp:reconnecting', {
      channelId,
      status: 'RECONNECTING',
      timestamp: new Date().toISOString(),
    });
  }

  emitWhatsappConnecting(tenantId: string, channelId: string) {
    const roomName = `tenant-${tenantId}`;
    this.logger.log(`Emitting WhatsApp connecting for channel ${channelId} to ${roomName}`);
    this.server.to(roomName).emit('whatsapp:connecting', {
      channelId,
      status: 'CONNECTING',
      timestamp: new Date().toISOString(),
    });
  }

  // Método genérico para emitir eventos customizados para um tenant
  emitToTenant(tenantId: string, eventName: string, data: any) {
    const roomName = `tenant-${tenantId}`;
    this.logger.log(`Emitting custom event '${eventName}' to ${roomName}`);
    this.server.to(roomName).emit(eventName, {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }
}
