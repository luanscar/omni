import { Injectable, Logger, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  WASocket,
  AnyMessageContent
} from '@whiskeysockets/baileys';
import * as qrcode from 'qrcode';
import * as fs from 'fs';
import * as path from 'path';
import { StorageService } from '../storage/storage.service';
import { MessageType } from 'prisma/generated/enums';

export interface SendMessageOptions {
  to: string;
  type: MessageType;
  content?: string;
  mediaId?: string;
  location?: any;
  contact?: any;
  reaction?: any;
  replyToProviderId?: string;
}

@Injectable()
export class WhatsappService implements OnModuleInit {
  private readonly logger = new Logger(WhatsappService.name);
  private sessions = new Map<string, WASocket>();
  private qrCodes = new Map<string, string>();
  private connectionStatus = new Map<string, string>();

  constructor(
    private prisma: PrismaService,
    @InjectQueue('whatsapp-events') private queue: Queue,
    @Inject(forwardRef(() => StorageService))
    private storageService: StorageService
  ) { }

  async onModuleInit() {
    this.ensureSessionsDir();
    await this.reconnectSavedSessions();
  }

  getSocket(channelId: string): WASocket | undefined {
    return this.sessions.get(channelId);
  }

  // --- IMPLEMENTAÇÃO DO ENVIO ---
  async sendMessage(channelId: string, options: SendMessageOptions): Promise<string | null> {
    const socket = this.getSocket(channelId);
    if (!socket) {
      throw new Error(`Sessão do WhatsApp não encontrada ou desconectada para o canal ${channelId}.`);
    }

    let jid = options.to;
    if (!jid.includes('@')) {
      jid = `${jid}@s.whatsapp.net`;
    }

    let payload: AnyMessageContent;

    switch (options.type) {
      case MessageType.TEXT:
        payload = { text: options.content || '' };
        break;

      case MessageType.IMAGE:
      case MessageType.VIDEO:
      case MessageType.AUDIO:
      case MessageType.DOCUMENT:
      case MessageType.STICKER:
        if (!options.mediaId) throw new Error('MediaID é obrigatório para envio de mídia.');

        const mediaInfo = await this.storageService.getDownloadUrl(options.mediaId, 'SYSTEM');
        const mediaObj = { url: mediaInfo.url };

        if (options.type === MessageType.IMAGE) {
          payload = { image: mediaObj, caption: options.content };
        } else if (options.type === MessageType.VIDEO) {
          payload = { video: mediaObj, caption: options.content };
        } else if (options.type === MessageType.AUDIO) {
          payload = { audio: mediaObj, mimetype: mediaInfo.mimeType || 'audio/mp4', ptt: true };
        } else if (options.type === MessageType.STICKER) {
          payload = { sticker: mediaObj };
        } else {
          payload = {
            document: mediaObj,
            mimetype: mediaInfo.mimeType || 'application/octet-stream',
            fileName: mediaInfo.originalName || options.content || 'arquivo'
          };
        }
        break;

      case MessageType.LOCATION:
        if (!options.location) throw new Error('Dados de localização obrigatórios.');
        payload = {
          location: {
            degreesLatitude: options.location.degreesLatitude,
            degreesLongitude: options.location.degreesLongitude,
            name: options.location.name,
            address: options.location.address
          }
        };
        break;

      case MessageType.CONTACT:
        if (!options.contact) throw new Error('Dados do contato obrigatórios.');
        payload = {
          contacts: {
            displayName: options.contact.displayName,
            contacts: [{ vcard: options.contact.vcard }]
          }
        };
        break;

      case MessageType.REACTION:
        if (!options.reaction) throw new Error('Dados da reação obrigatórios.');
        payload = {
          react: {
            text: options.reaction.text,
            key: {
              remoteJid: jid,
              id: options.reaction.key,
              fromMe: false
            }
          }
        };
        break;

      default:
        throw new Error(`Tipo de mensagem não suportado: ${options.type}`);
    }

    // --- LÓGICA DE QUOTE / REPLY ---
    let quoteOptions = {};
    if (options.replyToProviderId) {
      // Stub para o Baileys entender que é uma resposta
      const quotedMsgStub: any = {
        key: {
          remoteJid: jid,
          id: options.replyToProviderId,
          fromMe: false,
          participant: jid
        },
        message: { conversation: "..." }
      };

      quoteOptions = { quoted: quotedMsgStub };
    }

    const sentMsg = await socket.sendMessage(jid, payload, quoteOptions);
    return sentMsg?.key.id || null;
  }

  // --- MÉTODOS DE SESSÃO ---

  private ensureSessionsDir() {
    const dir = path.join(process.cwd(), 'sessions');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  }

  private async reconnectSavedSessions() {
    const channels = await this.prisma.channel.findMany({
      where: { type: 'WHATSAPP', active: true },
    });
    for (const channel of channels) {
      const sessionPath = path.join(process.cwd(), 'sessions', channel.id);
      if (fs.existsSync(sessionPath)) {
        this.startSession(channel.id, channel.tenantId);
      }
    }
  }

  async startSession(channelId: string, tenantId?: string) {
    if (!tenantId) {
      const channel = await this.prisma.channel.findUnique({ where: { id: channelId } });
      tenantId = channel?.tenantId;
    }

    if (this.sessions.has(channelId)) {
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
        const qrCodeDataURL = await qrcode.toDataURL(qr);
        this.qrCodes.set(channelId, qrCodeDataURL);
        this.connectionStatus.set(channelId, 'QRCODE_READY');
      }
      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;
        this.cleanUpSession(channelId);
        if (shouldReconnect) {
          setTimeout(() => this.startSession(channelId, tenantId), 3000);
        } else {
          this.connectionStatus.set(channelId, 'DISCONNECTED');
          await this.prisma.channel.update({ where: { id: channelId }, data: { active: false, identifier: null } });
        }
      } else if (connection === 'open') {
        this.connectionStatus.set(channelId, 'CONNECTED');
        this.qrCodes.delete(channelId);
        const userJid = socket.user?.id ? socket.user.id.split(':')[0] : null;
        if (userJid) {
          await this.prisma.channel.update({ where: { id: channelId }, data: { identifier: userJid, active: true } });
        }
      }
    });

    socket.ev.on('messages.upsert', async (m) => {
      if (m.type === 'notify') {
        for (const msg of m.messages) {
          await this.queue.add('process-message', {
            message: msg,
            channelId: channelId,
            tenantId: tenantId
          }, {
            attempts: 3,
            backoff: 5000
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
      await socket.logout();
      this.cleanUpSession(channelId);
      const authPath = path.join(process.cwd(), 'sessions', channelId);
      if (fs.existsSync(authPath)) fs.rmSync(authPath, { recursive: true, force: true });
      this.connectionStatus.set(channelId, 'DISCONNECTED');
      await this.prisma.channel.update({ where: { id: channelId }, data: { active: false, identifier: null } });
      return { status: 'LOGGED_OUT' };
    }
    throw new Error('Session not found');
  }

  private cleanUpSession(channelId: string) {
    this.sessions.delete(channelId);
    this.qrCodes.delete(channelId);
  }
}