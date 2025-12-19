import { Controller, Get, Post, Body, Patch, Param, Query, Request } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { ConversationStatus, UserRole } from 'prisma/generated/enums';

@ApiTags('Conversations')
@ApiBearerAuth()
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) { }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT)
  @ApiOperation({ summary: 'Iniciar uma nova conversa (Atendimento ou Chat Interno)' })
  @ApiResponse({ status: 201, description: 'Conversa criada ou recuperada com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  create(@Body() createConversationDto: CreateConversationDto, @Request() req) {
    return this.conversationsService.create(createConversationDto, req.user.tenantId, req.user.userId);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT)
  @ApiOperation({ summary: 'Listar conversas' })
  @ApiQuery({ name: 'status', enum: ConversationStatus, required: false, description: 'Filtrar por status' })
  @ApiResponse({ status: 200, description: 'Lista retornada.' })
  findAll(@Query('status') status: ConversationStatus, @Request() req) {
    return this.conversationsService.findAll(req.user.tenantId, status);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT)
  @ApiOperation({ summary: 'Detalhes da conversa' })
  @ApiResponse({ status: 200, description: 'Detalhes encontrados.' })
  @ApiResponse({ status: 404, description: 'Conversa não encontrada.' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.conversationsService.findOne(id, req.user.tenantId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT)
  @ApiOperation({ summary: 'Atualizar status ou transferir conversa' })
  @ApiResponse({ status: 200, description: 'Conversa atualizada.' })
  update(@Param('id') id: string, @Body() updateConversationDto: UpdateConversationDto, @Request() req) {
    return this.conversationsService.update(id, updateConversationDto, req.user.tenantId);
  }
}