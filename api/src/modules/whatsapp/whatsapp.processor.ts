import { Process, Processor } from '@nestjs/bull';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../../prisma.service';
import { WhatsappService } from './whatsapp.service';
import { StorageService } from '../storage/storage.service';
import { EventsGateway } from '../events/events.gateway';
import { downloadMediaMessage, WAMessage, getContentType } from '@whiskeysockets/baileys';
import * as path from 'path';
import { ConversationStatus, MessageSenderType } from 'prisma/generated/enums';

@Processor('whatsapp-events')
export class WhatsappProcessor {
    private readonly logger = new Logger(WhatsappProcessor.name);

    constructor(
        private prisma: PrismaService,
        @Inject(forwardRef(() => WhatsappService))
        private whatsappService: WhatsappService,
        private storageService: StorageService,
        private eventsGateway: EventsGateway,
    ) { }

    @Process('process-message')
    async handleIncomingMessage(job: Job<any>) {
        const { message, channelId, tenantId } = job.data as { message: WAMessage, channelId: string, tenantId: string };

        // Ignora mensagens enviadas por mim (via celular) para evitar duplicidade se não quisermos tratar "mensagens enviadas"
        if (message.key.fromMe) return;

        const remoteJid = message.key.remoteJid;
        const isGroup = remoteJid.endsWith('@g.us');
        const pushName = message.pushName || (isGroup ? 'Grupo' : 'Desconhecido');

        this.logger.debug(`Processing message type: ${getContentType(message.message)} from ${remoteJid}`);

        try {
            // 1. Processamento do Conteúdo (Texto e Mídia)
            const { content, mediaId } = await this.extractMessageContent(message, tenantId);

            // Se não conseguiu extrair nada (ex: tipo desconhecido ou erro no download), aborta para não salvar lixo
            if (!content && !mediaId) {
                this.logger.warn(`Skipping message ${message.key.id}: No content extracted.`);
                return;
            }

            // 2. Gestão de Contato (Busca ou Cria)
            const contact = await this.findOrCreateContact(tenantId, remoteJid, pushName, channelId, isGroup);

            // 3. Gestão de Conversa (Busca ou Cria)
            const conversation = await this.findOrCreateConversation(tenantId, channelId, contact.id);

            // 4. Salvar Mensagem
            const savedMessage = await this.prisma.message.create({
                data: {
                    conversationId: conversation.id,
                    content: content,
                    mediaId: mediaId,
                    senderType: MessageSenderType.CONTACT,
                    senderContactId: contact.id,
                    read: false,
                },
                include: {
                    senderContact: true,
                    media: true
                }
            });

            this.logger.log(`Message saved! ID: ${savedMessage.id} | Type: ${mediaId ? 'Media' : 'Text'}`);

            // 5. Realtime
            this.eventsGateway.emitNewMessage(tenantId, {
                ...savedMessage,
                conversationId: conversation.id
            });

        } catch (error) {
            this.logger.error(`Error processing message: ${error.message}`, error.stack);
            throw error;
        }
    }

    // --- MÉTODOS AUXILIARES ---

    private async extractMessageContent(message: WAMessage, tenantId: string): Promise<{ content: string | null, mediaId: string | null }> {
        const msg = message.message;
        if (!msg) return { content: null, mediaId: null };

        const type = getContentType(msg);
        let content: string | null = null;
        let mediaId: string | null = null;

        try {
            switch (type) {
                // --- TEXTO ---
                case 'conversation':
                    content = msg.conversation;
                    break;
                case 'extendedTextMessage':
                    content = msg.extendedTextMessage.text;
                    break;

                // --- IMAGEM ---
                case 'imageMessage':
                    content = msg.imageMessage.caption || '[Imagem]';
                    mediaId = await this.downloadAndSaveMedia(message, 'image', tenantId);
                    break;

                // --- VÍDEO ---
                case 'videoMessage':
                    content = msg.videoMessage.caption || '[Vídeo]';
                    mediaId = await this.downloadAndSaveMedia(message, 'video', tenantId);
                    break;

                // --- ÁUDIO (PTT ou Audio) ---
                case 'audioMessage':
                    const isPtt = msg.audioMessage.ptt;
                    content = isPtt ? '[Mensagem de Voz]' : '[Áudio]';
                    mediaId = await this.downloadAndSaveMedia(message, 'audio', tenantId);
                    break;

                // --- DOCUMENTO ---
                case 'documentMessage':
                    content = msg.documentMessage.fileName || '[Documento]';
                    mediaId = await this.downloadAndSaveMedia(message, 'document', tenantId);
                    break;

                // --- STICKER ---
                case 'stickerMessage':
                    content = '[Figurinha]';
                    mediaId = await this.downloadAndSaveMedia(message, 'sticker', tenantId);
                    break;

                // --- CONTATO ---
                case 'contactMessage':
                    content = `[Contato]: ${msg.contactMessage.displayName}`;
                    // Futuro: Poderíamos parsear o vCard aqui
                    break;

                // --- LOCALIZAÇÃO ---
                case 'locationMessage':
                    const { degreesLatitude, degreesLongitude, address } = msg.locationMessage;
                    content = `[Localização]: ${address || ''} (${degreesLatitude}, ${degreesLongitude})`;
                    break;

                // --- REAÇÃO ---
                case 'reactionMessage':
                    content = `[Reação]: ${msg.reactionMessage.text}`;
                    // Nota: Idealmente reações atualizariam a mensagem original, mas por enquanto salvamos como log
                    break;

                default:
                    content = `[Tipo não suportado: ${type}]`;
                    break;
            }
        } catch (err) {
            this.logger.error(`Failed to extract content for type ${type}: ${err.message}`);
            content = `[Erro ao baixar mídia]`;
        }

        return { content, mediaId };
    }

    private async downloadAndSaveMedia(message: WAMessage, type: 'image' | 'video' | 'audio' | 'document' | 'sticker', tenantId: string): Promise<string | null> {
        try {
            this.logger.debug(`Downloading ${type} media...`);

            // O Baileys faz o trabalho pesado de descriptografar e baixar
            const buffer = await downloadMediaMessage(
                message,
                'buffer',
                {},
                {
                    logger: this.logger as any,
                    reuploadRequest: (msg) => new Promise((resolve) => resolve(msg)) // Mock para evitar erros de reupload
                }
            );

            // Determinar extensão e mimetype
            let mimetype = 'application/octet-stream';
            let ext = '.bin';
            let originalName = `whatsapp_media_${Date.now()}`;

            // Cast para any aqui resolve o problema de acesso dinâmico a propriedades que não existem em todos os tipos (como fileName)
            const msgContent = message.message?.[`${type}Message`] as any;

            if (msgContent) {
                mimetype = msgContent.mimetype || mimetype;

                if (type === 'image') ext = '.jpg';
                else if (type === 'video') ext = '.mp4';
                else if (type === 'audio') ext = '.ogg'; // WhatsApp audios usually ogg/opus
                else if (type === 'sticker') ext = '.webp';
                else if (type === 'document') {
                    // Agora o TS aceita fileName porque msgContent é any
                    originalName = msgContent.fileName || originalName;
                    ext = path.extname(originalName) || '.pdf'; // Fallback
                }
            }

            // Preparar objeto para o StorageService
            const mockFile = {
                filename: type === 'document' ? originalName : `${originalName}${ext}`,
                mimetype: mimetype,
                toBuffer: async () => buffer
            };

            // Upload para LocalStack/S3
            const media = await this.storageService.uploadFile(mockFile, tenantId, null);
            this.logger.debug(`Media saved: ${media.id}`);
            return media.id;

        } catch (error) {
            this.logger.error(`Media download failed: ${error.message}`);
            return null;
        }
    }

    // --- MÉTODOS DE BUSCA/CRIAÇÃO REFATORADOS PARA LIMPEZA ---

    private async findOrCreateContact(tenantId: string, remoteJid: string, pushName: string, channelId: string, isGroup: boolean) {
        let contact = await this.prisma.contact.findFirst({
            where: { tenantId, phoneNumber: remoteJid }
        });

        if (!contact) {
            let profilePicUrl = null;
            try {
                const socket = this.whatsappService.getSocket(channelId);
                if (socket) {
                    // Timeout race para não travar a fila
                    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000));
                    const waUrl = await Promise.race([socket.profilePictureUrl(remoteJid, 'image'), timeoutPromise]) as string;

                    if (waUrl) {
                        const response = await fetch(waUrl);
                        const buffer = Buffer.from(await response.arrayBuffer());
                        const media = await this.storageService.uploadFile({
                            filename: `profile_${remoteJid}.jpg`,
                            mimetype: 'image/jpeg',
                            toBuffer: async () => buffer
                        }, tenantId, null);
                        profilePicUrl = `/storage/${media.id}/download`;
                    }
                }
            } catch (e) { /* ignore */ }

            contact = await this.prisma.contact.create({
                data: {
                    tenantId,
                    name: pushName,
                    phoneNumber: remoteJid,
                    profilePicUrl,
                    customFields: { isGroup }
                }
            });
        }
        return contact;
    }

    private async findOrCreateConversation(tenantId: string, channelId: string, contactId: string) {
        let conversation = await this.prisma.conversation.findFirst({
            where: { tenantId, channelId, contactId }
        });

        if (!conversation) {
            conversation = await this.prisma.conversation.create({
                data: {
                    tenantId,
                    channelId,
                    contactId,
                    status: ConversationStatus.PENDING,
                }
            });
        }
        return conversation;
    }
}