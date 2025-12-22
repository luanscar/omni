import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  Request,
} from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Conversation } from './entities/conversation.entity';
import { Roles } from '../../common/decorators/roles.decorator';
import { ConversationStatus, UserRole } from 'prisma/generated/enums';

@ApiTags('Conversations')
@ApiBearerAuth()
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT)
  @ApiOperation({
    summary: 'Criar nova conversa',
    description:
      'Inicia conversa de atendimento (com contactId e channelId) ou chat interno (com teamId). Se já existir conversa aberta para o contato, retorna a existente.',
  })
  @ApiResponse({
    status: 201,
    description: 'Conversa criada ou recuperada.',
    type: Conversation,
  })
  @ApiResponse({
    status: 400,
    description: 'Falta contactId/teamId ou ambos foram fornecidos.',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Proibido.' })
  create(@Body() createConversationDto: CreateConversationDto, @Request() req) {
    return this.conversationsService.create(
      createConversationDto,
      req.user.tenantId,
      req.user.userId,
    );
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT)
  @ApiOperation({
    summary: 'Listar conversas',
    description:
      'Lista conversas ordenadas por atualização. Inclui última mensagem, contato, agente atribuído e contador de mensagens.',
  })
  @ApiQuery({
    name: 'status',
    enum: ConversationStatus,
    required: false,
    description: 'Filtrar por status: OPEN, PENDING ou CLOSED',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista com última mensagem, contato, agente e contador.',
    type: [Conversation],
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Proibido.' })
  findAll(@Query('status') status: ConversationStatus, @Request() req) {
    return this.conversationsService.findAll(req.user.tenantId, status);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT)
  @ApiOperation({ summary: 'Detalhes da conversa' })
  @ApiResponse({
    status: 200,
    description: 'Detalhes encontrados.',
    type: Conversation,
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Proibido.' })
  @ApiResponse({ status: 404, description: 'Conversa não encontrada.' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.conversationsService.findOne(id, req.user.tenantId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT)
  @ApiOperation({
    summary: 'Atualizar conversa',
    description:
      'Altera status (OPEN/PENDING/CLOSED) ou transfere para outro agente (assigneeId).',
  })
  @ApiResponse({
    status: 200,
    description: 'Conversa atualizada.',
    type: Conversation,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Proibido.' })
  @ApiResponse({ status: 404, description: 'Conversa não encontrada.' })
  update(
    @Param('id') id: string,
    @Body() updateConversationDto: UpdateConversationDto,
    @Request() req,
  ) {
    return this.conversationsService.update(
      id,
      updateConversationDto,
      req.user.tenantId,
    );
  }
}
