import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { MessageSenderType, MessageType } from 'prisma/generated/enums';

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    // ForwardRef evita dependência circular entre Message <-> Whatsapp
    @Inject(forwardRef(() => WhatsappService))
    private whatsappService: WhatsappService,
  ) { }

  async create(createMessageDto: CreateMessageDto, tenantId: string, userId: string) {
    const { conversationId, type, content, mediaId, location, contact, reaction, replyToId } = createMessageDto;

    // 1. Verificar conversa e permissão
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, tenantId },
      include: { channel: true, contact: true }
    });

    if (!conversation) {
      throw new NotFoundException('Conversa não encontrada.');
    }

    // 2. Verificar mensagem citada (Reply) para pegar o ID do provedor (WhatsApp ID)
    let quotedMessage = null;
    if (replyToId) {
      quotedMessage = await this.prisma.message.findUnique({
        where: { id: replyToId }
      });

      if (!quotedMessage || quotedMessage.conversationId !== conversationId) {
        throw new BadRequestException('Mensagem citada inválida ou não pertence a esta conversa.');
      }
    }

    // 3. Montar Metadados (Metadata JSON)
    let metadata: any = null;
    if (type === MessageType.LOCATION) metadata = location;
    if (type === MessageType.CONTACT) metadata = contact;
    if (type === MessageType.REACTION) metadata = reaction;

    // 4. Salvar Mensagem no Banco (Estado "Enviando")
    const message = await this.prisma.message.create({
      data: {
        conversationId,
        type,
        content,
        mediaId,
        metadata,
        quotedMessageId: replyToId,
        senderType: MessageSenderType.USER, // Enviada por um Agente
        senderUserId: userId,
        read: true, // Mensagens enviadas por nós já nascem lidas
      },
      include: {
        senderUser: { select: { id: true, name: true, avatarUrl: true } },
        media: true,
        quotedMessage: true
      }
    });

    // 5. Integração com WhatsApp (Baileys)
    // Só enviamos se for uma conversa externa (tem contato e canal WhatsApp)
    if (conversation.contactId && conversation.channelId && conversation.channel.type === 'WHATSAPP') {
      try {
        // O método sendMessage retorna o ID da mensagem gerado pelo WhatsApp (providerId)
        const providerId = await this.whatsappService.sendMessage(conversation.channelId, {
          to: conversation.contact.phoneNumber,
          type: type,
          content: content,
          mediaId: mediaId,
          location: location,
          contact: contact,
          reaction: reaction,
          // Passamos o ID original da mensagem do WhatsApp para fazer o Reply
          replyToProviderId: quotedMessage?.providerId
        });

        // 6. Atualizar a mensagem com o ID real do provedor
        if (providerId) {
          await this.prisma.message.update({
            where: { id: message.id },
            data: { providerId }
          });
        }

      } catch (error) {
        console.error(`[MessagesService] Erro ao enviar mensagem ${message.id}:`, error);
        // Aqui você poderia atualizar o status da mensagem para "ERRO" se tivesse esse campo
      }
    }

    return message;
  }

  async findByConversation(conversationId: string, tenantId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, tenantId }
    });

    if (!conversation) throw new NotFoundException('Conversa não encontrada.');

    return this.prisma.message.findMany({
      where: { conversationId },
      include: {
        senderUser: { select: { id: true, name: true, avatarUrl: true } },
        senderContact: { select: { id: true, name: true, profilePicUrl: true } },
        media: true,
        quotedMessage: {
          include: {
            senderUser: { select: { name: true } },
            senderContact: { select: { name: true } },
            media: true // Inclui média da mensagem citada para exibir thumbnail
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
  }
}