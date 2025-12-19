import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessageSenderType } from 'prisma/generated/enums';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) { }

  async create(createMessageDto: CreateMessageDto, tenantId: string, userId: string) {
    const { conversationId, content, mediaId } = createMessageDto;

    // 1. Verificar se a conversa existe e pertence ao tenant
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, tenantId }
    });

    if (!conversation) {
      throw new NotFoundException('Conversa não encontrada.');
    }

    if (!content && !mediaId) {
      throw new BadRequestException('A mensagem deve conter texto ou mídia.');
    }

    // 2. Criar a mensagem no banco
    const message = await this.prisma.message.create({
      data: {
        conversationId,
        content,
        mediaId,
        senderType: MessageSenderType.USER, // Assumindo que quem chama a API é sempre um usuário/agente
        senderUserId: userId,
        read: true // Mensagem do próprio usuário já nasce lida
      },
      include: {
        senderUser: { select: { id: true, name: true, avatarUrl: true } },
        media: true
      }
    });

    // TODO: Se for uma conversa externa (com contactId), aqui dispararíamos o envio para o WhatsappService/Queue

    return message;
  }

  async findByConversation(conversationId: string, tenantId: string) {
    // Verifica acesso
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, tenantId }
    });
    if (!conversation) throw new NotFoundException('Conversa não encontrada.');

    return this.prisma.message.findMany({
      where: { conversationId },
      include: {
        senderUser: { select: { id: true, name: true, avatarUrl: true } },
        senderContact: { select: { id: true, name: true, profilePicUrl: true } },
        media: true
      },
      orderBy: { createdAt: 'asc' } // Mensagens mais antigas primeiro (histórico)
    });
  }
}