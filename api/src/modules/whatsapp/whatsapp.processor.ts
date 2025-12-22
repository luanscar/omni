import { Process, Processor } from '@nestjs/bull';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../../prisma.service';
import { WhatsappService } from './whatsapp.service';
import { StorageService } from '../storage/storage.service';
import { EventsGateway } from '../events/events.gateway';
import {
  downloadMediaMessage,
  WAMessage,
  getContentType,
} from '@whiskeysockets/baileys';
import * as path from 'path';
import {
  ConversationStatus,
  MessageSenderType,
  AuditStatus,
} from 'prisma/generated/enums';
import { AuditService } from '../audit/audit.service';

@Processor('whatsapp-events')
export class WhatsappProcessor {
  private readonly logger = new Logger(WhatsappProcessor.name);

  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => WhatsappService))
    private whatsappService: WhatsappService,
    private storageService: StorageService,
    private eventsGateway: EventsGateway,
    private auditService: AuditService,
  ) { }

  @Process('process-message')
  async handleIncomingMessage(job: Job<any>) {
    const { message, channelId, tenantId } = job.data as {
      message: WAMessage;
      channelId: string;
      tenantId: string;
    };

    const remoteJid = message.key.remoteJid;
    const isGroup = remoteJid.endsWith('@g.us');
    const isFromMe = message.key.fromMe;

    // Identificar o remetente real (Participant se for grupo, RemoteJid se for privado)
    // Em alguns casos de grupos antigos/migrados, participant pode ser nulo, fallback para remoteJid
    const participantJid = isGroup ? (message.key.participant || remoteJid) : remoteJid;
    const senderPushName = message.pushName || (isGroup ? 'Participante Desconhecido' : 'Desconhecido');

    this.logger.debug(
      `Processing message type: ${getContentType(message.message)} from ${remoteJid} | participant: ${participantJid} | fromMe: ${isFromMe}`,
    );

    // Ignorar reações - não são mensagens tradicionais
    const messageType = getContentType(message.message);
    if (messageType === 'reactionMessage') {
      this.logger.debug(`Ignoring reaction message`);
      return;
    }

    // Mensagens enviadas pelo sistema (fromMe) já foram salvas pelo messages.service com o userId correto
    // Aqui processamos apenas mensagens RECEBIDAS de contatos
    if (isFromMe) {
      this.logger.debug(
        `Ignoring fromMe message - already processed by messages.service`,
      );
      return;
    }

    try {
      const { content, mediaId, metadata } = await this.extractMessageContent(
        message,
        tenantId,
      );

      if (!content && !mediaId) {
        this.logger.warn(
          `Skipping message ${message.key.id}: No content extracted.`,
        );
        return;
      }

      // 1. Tratar o Contato da CONVERSA (Grupo ou Indivíduo)
      // Se for grupo, o contato da conversa é o ID do Grupo.
      let conversationContactName = senderPushName;

      // Se for novo contato de grupo, tentamos pegar o nome real do grupo
      if (isGroup) {
        const groupContact = await this.prisma.contact.findFirst({
          where: { tenantId, phoneNumber: remoteJid },
        });

        if (groupContact) {
          conversationContactName = groupContact.name;
        } else {
          // Tentar buscar metadados do grupo através do socket
          try {
            const socket = this.whatsappService.getSocket(channelId);
            if (socket) {
              const groupMetadata = await socket.groupMetadata(remoteJid);
              conversationContactName = groupMetadata.subject || `Grupo ${remoteJid.slice(0, 4)}`;
            } else {
              conversationContactName = `Grupo ${remoteJid.slice(0, 4)}...`;
            }
          } catch (err) {
            this.logger.warn(`Failed to fetch group metadata for ${remoteJid}: ${err.message}`);
            conversationContactName = `Grupo ${remoteJid.slice(0, 4)}...`;
          }
        }
      }

      const conversationContact = await this.findOrCreateContact(
        tenantId,
        remoteJid,
        conversationContactName, // Nome do Grupo (se grupo) ou Nome do Contato (se privado)
        channelId,
        isGroup,
      );

      const conversation = await this.findOrCreateConversation(
        tenantId,
        channelId,
        conversationContact.id,
      );

      // 2. Tratar o Contato do REMETENTE (Quem enviou)
      let senderContact;

      if (isGroup) {
        // O remetente é o participante. Criamos um contato separado para ele se não existir.
        // O 'isGroup' aqui é false, pois o participante é uma pessoa (exceto se for grupo dentro de comunidade, mas vamos assumir pessoa)
        senderContact = await this.findOrCreateContact(
          tenantId,
          participantJid,
          senderPushName,
          channelId,
          false
        );
      } else {
        // Se conversa privada, o remetente é o próprio contato da conversa
        senderContact = conversationContact;
      }

      // Detectar se é uma resposta (quotedMessage)
      let quotedMessageId: string | null = null;
      const msg = message.message;

      // Log detalhado para debug
      this.logger.debug(`Message structure: ${JSON.stringify(msg, null, 2)}`);

      // O contextInfo pode estar em qualquer tipo de mensagem
      const contextInfo =
        msg?.extendedTextMessage?.contextInfo ||
        msg?.imageMessage?.contextInfo ||
        msg?.videoMessage?.contextInfo ||
        msg?.audioMessage?.contextInfo ||
        msg?.documentMessage?.contextInfo ||
        msg?.stickerMessage?.contextInfo;

      this.logger.debug(
        `ContextInfo found: ${JSON.stringify(contextInfo, null, 2)}`,
      );

      if (contextInfo?.stanzaId) {
        const quotedProviderId = contextInfo.stanzaId;
        this.logger.debug(`Message is a reply to: ${quotedProviderId}`);

        // Buscar a mensagem original pelo providerId
        const quotedMessage = await this.prisma.message.findFirst({
          where: {
            conversationId: conversation.id,
            providerId: quotedProviderId,
          },
        });

        if (quotedMessage) {
          quotedMessageId = quotedMessage.id;
          this.logger.debug(`Found quoted message: ${quotedMessageId}`);
        } else {
          this.logger.warn(
            `Quoted message not found for providerId: ${quotedProviderId}`,
          );
        }
      } else {
        this.logger.debug(`No contextInfo.stanzaId found - not a reply`);
      }

      const savedMessage = await this.prisma.message.create({
        data: {
          conversationId: conversation.id,
          providerId: message.key.id,
          content: content,
          mediaId: mediaId,
          metadata: metadata,
          senderType: MessageSenderType.CONTACT,
          senderContactId: senderContact.id, // VINCULA AO REMETENTE REAL (PARTICIPANTE)
          quotedMessageId: quotedMessageId,
          read: false,
        },
        include: {
          senderContact: true,
          media: true,
        },
      });

      this.logger.log(
        `Message saved! ID: ${savedMessage.id} | Type: ${mediaId ? 'Media' : 'Text'} | Is Reply: ${!!quotedMessageId}`,
      );

      // ✅ Log de auditoria - mensagem recebida com sucesso
      await this.auditService.logMessage({
        tenantId,
        messageId: savedMessage.id,
        action: 'received',
        details: {
          from: remoteJid,
          hasMedia: !!mediaId,
          isReply: !!quotedMessageId,
        },
        status: AuditStatus.SUCCESS,
      });

      this.eventsGateway.emitNewMessage(tenantId, {
        ...savedMessage,
        conversationId: conversation.id,
      });
    } catch (error) {
      this.logger.error(
        `Error processing message: ${error.message}`,
        error.stack,
      );

      // ❌ Log de auditoria - falha ao processar mensagem
      await this.auditService.logMessage({
        tenantId,
        messageId: message.key.id,
        action: 'failed',
        details: {
          from: remoteJid,
          error: error.message,
          stack: error.stack,
        },
        status: AuditStatus.FAILED,
        errorMessage: error.message,
      });

      throw error;
    }
  }

  // --- MÉTODOS AUXILIARES ---

  private async extractMessageContent(
    message: WAMessage,
    tenantId: string,
  ): Promise<{
    content: string | null;
    mediaId: string | null;
    metadata: any;
  }> {
    const msg = message.message;
    if (!msg) return { content: null, mediaId: null, metadata: null };

    const type = getContentType(msg);
    let content: string | null = null;
    let mediaId: string | null = null;

    // Salvar TODA a mensagem original do Baileys no metadata
    const metadata = {
      messageType: type,
      rawMessage: msg,
      messageKey: message.key,
      pushName: message.pushName,
      timestamp: message.messageTimestamp,
    };

    try {
      switch (type) {
        case 'conversation':
          content = msg.conversation;
          break;
        case 'extendedTextMessage':
          content = msg.extendedTextMessage.text;
          break;

        case 'imageMessage':
          content = msg.imageMessage.caption || '[Imagem]';
          mediaId = await this.downloadAndSaveMedia(message, 'image', tenantId);
          break;

        case 'videoMessage':
          content = msg.videoMessage.caption || '[Vídeo]';
          mediaId = await this.downloadAndSaveMedia(message, 'video', tenantId);
          break;

        case 'audioMessage':
          const isPtt = msg.audioMessage.ptt;
          content = isPtt ? '[Mensagem de Voz]' : '[Áudio]';
          mediaId = await this.downloadAndSaveMedia(message, 'audio', tenantId);
          break;

        case 'documentMessage':
          content = msg.documentMessage.fileName || '[Documento]';
          mediaId = await this.downloadAndSaveMedia(
            message,
            'document',
            tenantId,
          );
          break;

        case 'stickerMessage':
          content = '[Figurinha]';
          mediaId = await this.downloadAndSaveMedia(
            message,
            'sticker',
            tenantId,
          );
          break;

        case 'contactMessage':
          const contactMsg = msg.contactMessage;
          content = `[Contato]: ${contactMsg.displayName}`;
          break;

        case 'locationMessage':
          const { degreesLatitude, degreesLongitude, address, name } =
            msg.locationMessage;
          content = `[Localização]: ${address || name || ''} (${degreesLatitude}, ${degreesLongitude})`;
          break;

        case 'reactionMessage':
          content = `[Reação]: ${msg.reactionMessage.text}`;
          break;

        default:
          content = `[Tipo não suportado: ${type}]`;
          break;
      }
    } catch (err) {
      this.logger.error(
        `Failed to extract content for type ${type}: ${err.message}`,
      );
      content = `[Erro ao baixar mídia]`;
    }

    return { content, mediaId, metadata };
  }

  private async downloadAndSaveMedia(
    message: WAMessage,
    type: 'image' | 'video' | 'audio' | 'document' | 'sticker',
    tenantId: string,
  ): Promise<string | null> {
    const maxRetries = 3;
    const baseDelay = 1000; // 1 segundo

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.debug(
          `Downloading ${type} media... (attempt ${attempt}/${maxRetries})`,
        );

        const buffer = await downloadMediaMessage(
          message,
          'buffer',
          {},
          {
            logger: this.logger as any,
            reuploadRequest: (msg) => new Promise((resolve) => resolve(msg)),
          },
        );

        let mimetype = 'application/octet-stream';
        let ext = '.bin';
        let originalName = `whatsapp_media_${Date.now()}`;

        const msgContent = (message.message as any)?.[`${type}Message`];

        if (msgContent) {
          mimetype = msgContent.mimetype || mimetype;

          if (type === 'image') ext = '.jpg';
          else if (type === 'video') ext = '.mp4';
          else if (type === 'audio') ext = '.ogg';
          else if (type === 'sticker') ext = '.webp';
          else if (type === 'document') {
            originalName = msgContent.fileName || originalName;
            ext = path.extname(originalName) || '.pdf';
          }
        }

        const mockFile = {
          filename:
            type === 'document' ? originalName : `${originalName}${ext}`,
          mimetype: mimetype,
          toBuffer: async () => buffer,
        };

        const media = await this.storageService.uploadFile(
          mockFile,
          tenantId,
          null,
          'messages',
        );
        this.logger.log(
          `✅ Media downloaded successfully on attempt ${attempt}: ${media.id}`,
        );

        // ✅ Log de auditoria - mídia baixada com sucesso
        await this.auditService.logMediaDownload({
          tenantId,
          messageId: message.key.id,
          mediaType: type,
          success: true,
          attempts: attempt,
        });

        return media.id;
      } catch (error) {
        const isLastAttempt = attempt === maxRetries;

        if (isLastAttempt) {
          // Última tentativa falhou
          this.logger.error(
            `❌ Media download failed after ${maxRetries} attempts: ${error.message}`,
          );
          this.logger.error(`Error stack: ${error.stack}`);
          this.logger.debug(`Message key: ${JSON.stringify(message.key)}`);

          // ❌ Log de auditoria - falha no download
          await this.auditService.logMediaDownload({
            tenantId,
            messageId: message.key.id,
            mediaType: type,
            success: false,
            attempts: maxRetries,
            errorMessage: error.message,
          });

          return null;
        } else {
          // Calcular delay exponencial: 1s, 2s, 4s
          const delay = baseDelay * Math.pow(2, attempt - 1);
          this.logger.warn(
            `⚠️ Attempt ${attempt} failed: ${error.message}. Retrying in ${delay}ms...`,
          );

          // Aguardar antes da próxima tentativa
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // Nunca deve chegar aqui, mas por segurança
    return null;
  }

  private async findOrCreateContact(
    tenantId: string,
    remoteJid: string,
    pushName: string,
    channelId: string,
    isGroup: boolean,
  ) {
    let contact = await this.prisma.contact.findFirst({
      where: { tenantId, phoneNumber: remoteJid },
    });

    if (!contact) {
      let profilePicUrl = null;
      try {
        const socket = this.whatsappService.getSocket(channelId);
        if (socket) {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 2000),
          );
          const waUrl = (await Promise.race([
            socket.profilePictureUrl(remoteJid, 'image'),
            timeoutPromise,
          ])) as string;

          if (waUrl) {
            const response = await fetch(waUrl);
            const buffer = Buffer.from(await response.arrayBuffer());
            const media = await this.storageService.uploadFile(
              {
                filename: `profile_${remoteJid}.jpg`,
                mimetype: 'image/jpeg',
                toBuffer: async () => buffer,
              },
              tenantId,
              null,
              'avatars',
            );
            profilePicUrl = `/storage/${media.id}/download`;
          }
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        /* ignore */
      }

      contact = await this.prisma.contact.create({
        data: {
          tenantId,
          name: pushName,
          phoneNumber: remoteJid,
          profilePicUrl,
          customFields: { isGroup },
        },
      });
    }
    return contact;
  }

  private async findOrCreateConversation(
    tenantId: string,
    channelId: string,
    contactId: string,
  ) {
    let conversation = await this.prisma.conversation.findFirst({
      where: { tenantId, channelId, contactId },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          tenantId,
          channelId,
          contactId,
          status: ConversationStatus.PENDING,
        },
      });
    }
    return conversation;
  }
}
