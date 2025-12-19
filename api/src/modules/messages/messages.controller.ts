import { Controller, Get, Post, Body, Param, Request } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from 'prisma/generated/enums';

@ApiTags('Messages')
@ApiBearerAuth()
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) { }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT)
  @ApiOperation({ summary: 'Enviar uma mensagem' })
  @ApiResponse({ status: 201, description: 'Mensagem enviada.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  create(@Body() createMessageDto: CreateMessageDto, @Request() req) {
    return this.messagesService.create(createMessageDto, req.user.tenantId, req.user.userId);
  }

  @Get('conversation/:conversationId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT)
  @ApiOperation({ summary: 'Listar mensagens de uma conversa' })
  @ApiResponse({ status: 200, description: 'Histórico de mensagens.' })
  findByConversation(@Param('conversationId') conversationId: string, @Request() req) {
    return this.messagesService.findByConversation(conversationId, req.user.tenantId);
  }
}