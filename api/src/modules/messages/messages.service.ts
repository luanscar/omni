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
    const { conversationId, type, content, mediaId, location, contact, reaction, replyToId, signMessage } = createMessageDto;

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

    // 3. Adicionar assinatura ao conteúdo se solicitado
    let finalContent = content;
    if (signMessage && content) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { name: true }
      });

      if (user) {
        finalContent = `*${user.name}:*\n${content}`;
      }
    }

    // 4. Montar Metadados (Metadata JSON)
    let metadata: any = null;
    if (type === MessageType.LOCATION) metadata = location;
    if (type === MessageType.CONTACT) metadata = contact;
    if (type === MessageType.REACTION) metadata = reaction;

    // 4.5. Tratamento especial para REAÇÕES
    // Reações não são mensagens tradicionais, apenas eventos efêmeros
    if (type === MessageType.REACTION) {
      if (!conversation.contactId || !conversation.channelId || conversation.channel.type !== 'WHATSAPP') {
        throw new BadRequestException('Reações só podem ser enviadas em conversas do WhatsApp.');
      }

      if (!reaction || !reaction.key) {
        throw new BadRequestException('Dados da reação são obrigatórios.');
      }

      // Buscar o providerId da mensagem alvo
      const targetMessage = await this.prisma.message.findUnique({
        where: { id: reaction.key },
        select: { providerId: true }
      });

      if (!targetMessage || !targetMessage.providerId) {
        throw new BadRequestException('Mensagem alvo da reação não encontrada ou não possui providerId.');
      }

      // Enviar reação diretamente para o WhatsApp (sem salvar no banco)
      try {
        await this.whatsappService.sendMessage(conversation.channelId, {
          to: conversation.contact.phoneNumber,
          type: MessageType.REACTION,
          reaction: {
            text: reaction.text,
            key: targetMessage.providerId
          },
          tenantId: tenantId
        });

        // Retornar resposta sem salvar no banco
        return {
          id: null,
          type: MessageType.REACTION,
          content: `Reação ${reaction.text} enviada`,
          conversationId,
          senderType: MessageSenderType.USER,
          senderUserId: userId,
          metadata: reaction,
          createdAt: new Date()
        };
      } catch (error) {
        throw new BadRequestException(`Erro ao enviar reação: ${error.message}`);
      }
    }

    // 5. Salvar Mensagem no Banco (Estado "Enviando")
    const message = await this.prisma.message.create({
      data: {
        conversationId,
        type,
        content: finalContent, // Usa o conteúdo com assinatura se aplicável
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

    // 6. Integração com WhatsApp (Baileys)
    // Só enviamos se for uma conversa externa (tem contato e canal WhatsApp)
    if (conversation.contactId && conversation.channelId && conversation.channel.type === 'WHATSAPP') {
      try {
        // O método sendMessage retorna o ID da mensagem gerado pelo WhatsApp (providerId)
        const providerId = await this.whatsappService.sendMessage(conversation.channelId, {
          to: conversation.contact.phoneNumber,
          type: type,
          content: finalContent, // Usa finalContent que inclui assinatura se aplicável
          mediaId: mediaId,
          location: location,
          contact: contact,
          reaction: null, // Reações já foram tratadas acima
          tenantId: tenantId, // Passa tenantId para buscar mídia corretamente
          // Passamos o ID original da mensagem do WhatsApp para fazer o Reply
          replyToProviderId: quotedMessage?.providerId
        });

        // 7. Atualizar a mensagem com o ID real do provedor
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