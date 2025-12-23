import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { ConversationStatus } from 'prisma/generated/enums';

@Injectable()
export class ConversationsService {
  constructor(private prisma: PrismaService) { }

  async create(
    createConversationDto: CreateConversationDto,
    tenantId: string,
    userId: string,
  ) {
    const { contactId, channelId, teamId } = createConversationDto;

    // Validação básica: Ou é chat de contato, ou é chat de time
    if (!contactId && !teamId) {
      throw new BadRequestException(
        'É necessário informar um ContactId (Atendimento) ou TeamId (Chat Interno).',
      );
    }

    if (contactId && teamId) {
      throw new BadRequestException(
        'Uma conversa não pode ser simultaneamente de Contato e de Time.',
      );
    }

    // Se for atendimento, verificar se já existe conversa ABERTA para esse contato no canal
    if (contactId) {
      const activeConvo = await this.prisma.conversation.findFirst({
        where: {
          tenantId,
          contactId,
          status: { not: ConversationStatus.CLOSED },
        },
      });
      if (activeConvo) {
        // Retorna a existente em vez de criar duplicada
        return activeConvo;
      }
    }

    // Buscar contato para pegar isGroup de customFields
    const contact = await this.prisma.contact.findUnique({
      where: { id: contactId },
      select: { customFields: true },
    });

    return this.prisma.conversation.create({
      data: {
        tenantId,
        contactId,
        channelId,
        teamId,
        assigneeId: contactId ? userId : null, // Se o agente abriu o ticket, já atribui a ele
        isGroup: (contact?.customFields as any)?.isGroup || false, // Extrai isGroup do customFields
      },
      include: {
        contact: true,
        assignee: true,
        team: true,
      },
    });
  }

  async findAll(tenantId: string, status?: ConversationStatus) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        tenantId,
        ...(status ? { status } : {}), // Filtro opcional por status
      },
      include: {
        contact: { select: { name: true, profilePicUrl: true } },
        assignee: { select: { name: true, avatarUrl: true } },
        team: { select: { name: true } },
        _count: { select: { messages: true } },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            media: true,
            senderContact: { select: { name: true } },
            senderUser: { select: { name: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Calcular contagem de mensagens não lidas para cada conversa
    const conversationsWithUnreadCount = await Promise.all(
      conversations.map(async (conversation) => {
        const unreadCount = await this.prisma.message.count({
          where: {
            conversationId: conversation.id,
            read: false,
            senderType: 'CONTACT', // Apenas mensagens recebidas do contato
          },
        });

        return {
          ...conversation,
          unreadCount,
        };
      }),
    );

    return conversationsWithUnreadCount;
  }

  async findOne(id: string, tenantId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id, tenantId },
      include: {
        contact: true,
        assignee: true,
        team: true,
        channel: true,
      },
    });

    if (!conversation) throw new NotFoundException('Conversa não encontrada.');
    return conversation;
  }

  async update(
    id: string,
    updateConversationDto: UpdateConversationDto,
    tenantId: string,
  ) {
    await this.findOne(id, tenantId); // Garante permissão
    return this.prisma.conversation.update({
      where: { id },
      data: updateConversationDto,
      include: { assignee: true },
    });
  }
}
