import { Controller, Get, Post, Body, Param, Request } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Message } from './entities/message.entity';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from 'prisma/generated/enums';

@ApiTags('Messages')
@ApiBearerAuth()
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) { }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT)
  @ApiOperation({ summary: 'Enviar uma mensagem (Texto, Mídia, Localização, etc)' })
  @ApiResponse({ status: 201, description: 'Mensagem salva e enfileirada para envio.', type: Message })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Proibido.' })
  create(@Body() createMessageDto: CreateMessageDto, @Request() req) {
    return this.messagesService.create(createMessageDto, req.user.tenantId, req.user.userId);
  }

  @Get('conversation/:conversationId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT)
  @ApiOperation({ summary: 'Listar histórico de mensagens' })
  @ApiResponse({ status: 200, description: 'Histórico retornado com sucesso.', type: [Message] })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Proibido.' })
  @ApiResponse({ status: 404, description: 'Conversa não encontrada.' })
  findByConversation(@Param('conversationId') conversationId: string, @Request() req) {
    return this.messagesService.findByConversation(conversationId, req.user.tenantId);
  }
}