import { Process, Processor } from '@nestjs/bull';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../../prisma.service';
import { WhatsappService } from './whatsapp.service';
import { StorageService } from '../storage/storage.service'; // Importar Storage
import { ConversationStatus, MessageSenderType } from 'prisma/generated/enums';

@Processor('whatsapp-events')
export class WhatsappProcessor {
    private readonly logger = new Logger(WhatsappProcessor.name);

    constructor(
        private prisma: PrismaService,
        @Inject(forwardRef(() => WhatsappService))
        private whatsappService: WhatsappService,
        private storageService: StorageService, // Injetar Storage
    ) { }

    @Process('process-message')
    async handleIncomingMessage(job: Job<any>) {
        const { message, channelId, tenantId } = job.data;

        const remoteJid = message.key.remoteJid;
        const isGroup = remoteJid.endsWith('@g.us');
        const pushName = message.pushName || (isGroup ? 'Grupo' : 'Desconhecido');

        // Tratamento de texto
        const textContent =
            message.message?.conversation ||
            message.message?.extendedTextMessage?.text ||
            message.message?.imageMessage?.caption ||
            (message.message?.imageMessage ? '[Imagem]' : null) ||
            (message.message?.audioMessage ? '[Áudio]' : null) ||
            'Conteúdo não suportado';

        if (message.key.fromMe) return;

        this.logger.debug(`Processing message from ${remoteJid} (PushName: ${pushName})`);

        try {
            let contactId: string | null = null;

            // 1. Busca Contato
            let contact = await this.prisma.contact.findFirst({
                where: { tenantId, phoneNumber: remoteJid }
            });

            if (!contact) {
                let profilePicUrl = null;

                // --- LÓGICA DE DOWNLOAD E UPLOAD DA FOTO ---
                try {
                    const socket = this.whatsappService.getSocket(channelId);
                    if (socket) {
                        const timeoutPromise = new Promise((_, reject) =>
                            setTimeout(() => reject(new Error('Timeout')), 2000)
                        );

                        // Pega a URL temporária do WhatsApp
                        const waUrl = await Promise.race([
                            socket.profilePictureUrl(remoteJid, 'image'),
                            timeoutPromise
                        ]) as string;

                        if (waUrl) {
                            this.logger.debug(`Downloading profile pic from WA: ${waUrl}`);

                            // 1. Baixa a imagem (Node 18+ tem fetch nativo)
                            const response = await fetch(waUrl);
                            const arrayBuffer = await response.arrayBuffer();
                            const buffer = Buffer.from(arrayBuffer);

                            // 2. Prepara objeto mock de arquivo para o StorageService
                            const mockFile = {
                                filename: `profile_${remoteJid}.jpg`,
                                mimetype: 'image/jpeg',
                                toBuffer: async () => buffer
                            };

                            // 3. Faz upload para o LocalStack/S3
                            const media = await this.storageService.uploadFile(
                                mockFile,
                                tenantId,
                                null // Upload de sistema (sem usuário)
                            );

                            // 4. Gera a URL interna permanente
                            profilePicUrl = `/storage/${media.id}/download`;
                            this.logger.debug(`Profile pic saved internally: ${profilePicUrl}`);
                        }
                    }
                } catch (error) {
                    this.logger.warn(`Skipping profile pic for ${remoteJid}: ${error.message}`);
                }
                // -------------------------------------------

                this.logger.log(`Creating new contact: ${pushName}`);
                contact = await this.prisma.contact.create({
                    data: {
                        tenantId,
                        name: pushName,
                        phoneNumber: remoteJid,
                        profilePicUrl: typeof profilePicUrl === 'string' ? profilePicUrl : null,
                        customFields: { isGroup }
                    }
                });
            }
            contactId = contact.id;

            // 2. Busca ou Cria Conversa
            let conversation = await this.prisma.conversation.findFirst({
                where: { tenantId, channelId, contactId }
            });

            if (!conversation) {
                this.logger.log(`Starting new conversation for contact ${contactId}`);
                conversation = await this.prisma.conversation.create({
                    data: {
                        tenantId,
                        channelId,
                        contactId,
                        status: ConversationStatus.PENDING,
                    }
                });
            }

            // 3. Salva Mensagem
            await this.prisma.message.create({
                data: {
                    conversationId: conversation.id,
                    content: textContent,
                    senderType: MessageSenderType.CONTACT,
                    senderContactId: contactId,
                    read: false,
                }
            });

            this.logger.log(`Message saved! ID: ${conversation.id}`);

        } catch (error) {
            this.logger.error(`Error processing message: ${error.message}`, error.stack);
            throw error;
        }
    }
}