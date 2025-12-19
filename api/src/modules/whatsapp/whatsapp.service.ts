import { Injectable, Logger } from '@nestjs/common';
import { CreateWhatsappDto } from './dto/create-whatsapp.dto';
import { UpdateWhatsappDto } from './dto/update-whatsapp.dto';
import { PrismaService } from 'src/prisma.service';
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  WASocket,
} from '@whiskeysockets/baileys';
import * as qrcode from 'qrcode';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class WhatsappService {


  private readonly logger = new Logger(WhatsappService.name);
  private sessions = new Map<string, WASocket>();
  private qrCodes = new Map<string, string>();
  private connectionStatus = new Map<string, string>();

  constructor(private prisma: PrismaService) { }


  async onModuleInit() {
    this.ensureSessionsDir();
    await this.reconnectSavedSessions(); // <--- Reconexão automática ao iniciar
  }


  private ensureSessionsDir() {
    const dir = path.join(process.cwd(), 'sessions');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
  }

  // Busca canais ativos no banco e tenta reconectar se existir pasta de sessão
  private async reconnectSavedSessions() {
    this.logger.log('Checking for saved WhatsApp sessions...');

    const channels = await this.prisma.channel.findMany({
      where: {
        type: 'WHATSAPP',
        active: true
      },
    });

    for (const channel of channels) {
      const sessionPath = path.join(process.cwd(), 'sessions', channel.id);
      // Só tenta reconectar se já existir a pasta de credenciais
      if (fs.existsSync(sessionPath)) {
        this.logger.log(`Restoring session for channel: ${channel.name} (${channel.id})`);
        this.startSession(channel.id);
      }
    }
  }

  async startSession(channelId: string) {
    // Evita duplicidade de socket na memória
    if (this.sessions.has(channelId)) {
      this.logger.log(`Session ${channelId} already exists in memory`);
      return { status: this.connectionStatus.get(channelId) || 'UNKNOWN' };
    }

    this.connectionStatus.set(channelId, 'CONNECTING');

    const authPath = path.join(process.cwd(), 'sessions', channelId);
    const { state, saveCreds } = await useMultiFileAuthState(authPath);
    const { version } = await fetchLatestBaileysVersion();

    const socket = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      browser: ['Omni SaaS', 'Chrome', '1.0.0'],
    });

    socket.ev.on('creds.update', saveCreds);

    socket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        this.logger.debug(`QR Code generated for ${channelId}`);
        const qrCodeDataURL = await qrcode.toDataURL(qr);
        this.qrCodes.set(channelId, qrCodeDataURL);
        this.connectionStatus.set(channelId, 'QRCODE_READY');
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        this.logger.warn(`Connection closed for ${channelId}. Reconnecting: ${shouldReconnect}`);

        this.cleanUpSession(channelId);

        if (shouldReconnect) {
          // Tenta reconectar (loop infinito de tentativas pode ser perigoso, ideal adicionar backoff)
          setTimeout(() => this.startSession(channelId), 3000);
        } else {
          this.connectionStatus.set(channelId, 'DISCONNECTED');
          // Se foi logout (desconectado pelo celular), atualiza o banco
          await this.prisma.channel.update({
            where: { id: channelId },
            data: { active: false, identifier: null }
          });
        }
      } else if (connection === 'open') {
        this.logger.log(`Connection opened for ${channelId}`);
        this.connectionStatus.set(channelId, 'CONNECTED');
        this.qrCodes.delete(channelId);

        // Pega o número do telefone conectado (JID)
        const userJid = socket.user?.id ? socket.user.id.split(':')[0] : null;

        // Atualiza o banco com o identificador oficial e marca como ativo
        if (userJid) {
          await this.prisma.channel.update({
            where: { id: channelId },
            data: {
              identifier: userJid,
              active: true
            }
          });
        }
      }
    });

    this.sessions.set(channelId, socket);
    return { status: 'INITIALIZING' };
  }

  getSessionStatus(channelId: string) {
    return {
      status: this.connectionStatus.get(channelId) || 'DISCONNECTED',
      qrCode: this.qrCodes.get(channelId) || null,
    };
  }

  async logout(channelId: string) {
    const socket = this.sessions.get(channelId);
    if (socket) {
      await socket.logout(); // Isso vai disparar o evento 'close' com motivo loggedOut
      this.cleanUpSession(channelId);

      const authPath = path.join(process.cwd(), 'sessions', channelId);
      if (fs.existsSync(authPath)) {
        fs.rmSync(authPath, { recursive: true, force: true });
      }

      this.connectionStatus.set(channelId, 'DISCONNECTED');

      // Atualiza banco para refletir o logout
      await this.prisma.channel.update({
        where: { id: channelId },
        data: { active: false, identifier: null }
      });

      return { status: 'LOGGED_OUT' };
    }
    throw new Error('Session not found');
  }

  private cleanUpSession(channelId: string) {
    this.sessions.delete(channelId);
    this.qrCodes.delete(channelId);
  }
}
