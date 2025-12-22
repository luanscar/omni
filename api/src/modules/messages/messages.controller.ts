import { Controller, Get, Post, Body, Param, Request } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { BatchMessageDto } from './dto/batch-message.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { Message } from './entities/message.entity';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from 'prisma/generated/enums';
import {
  ForwardMessageDto,
  ForwardBatchDto,
} from './dto/forward-message.dto';

@ApiTags('Messages')
@ApiBearerAuth()
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) { }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT)
  @ApiOperation({
    summary: 'Enviar uma mensagem',
    description: `
**Tipos de mensagens suportadas:**

**1. TEXTO**
\`\`\`json
{
  "conversationId": "uuid",
  "type": "TEXT",
  "content": "Olá!",
  "signMessage": false
}
\`\`\`

**2. IMAGEM** (primeiro faça upload em /storage/upload)
\`\`\`json
{
  "conversationId": "uuid",
  "type": "IMAGE",
  "mediaId": "uuid-do-upload",
  "content": "Legenda opcional"
}
\`\`\`

**3. VÍDEO/ÁUDIO/DOCUMENTO/STICKER** (mesmo fluxo da imagem)
\`\`\`json
{
  "conversationId": "uuid",
  "type": "VIDEO",  // ou AUDIO, DOCUMENT, STICKER
  "mediaId": "uuid-do-upload",
  "content": "Legenda ou nome do arquivo (opcional)"
}
\`\`\`

**4. REAÇÃO**
\`\`\`json
{
  "conversationId": "uuid",
  "type": "REACTION",
  "reaction": {
    "text": "❤️",
    "key": "uuid-da-mensagem-alvo"
  }
}
\`\`\`

**5. RESPONDER MENSAGEM** (adicione replyToId)
\`\`\`json
{
  "conversationId": "uuid",
  "type": "TEXT",
  "content": "Esta é uma resposta",
  "replyToId": "uuid-da-mensagem-original"
}
\`\`\`

**6. ASSINAR MENSAGEM** (adicione signMessage: true)
\`\`\`json
{
  "conversationId": "uuid",
  "type": "TEXT",
  "content": "Mensagem assinada",
  "signMessage": true
}
\`\`\`
Resultado: "*Nome do Agente:*\\nMensagem assinada"
    `,
  })
  @ApiResponse({
    status: 201,
    description: 'Mensagem salva e enfileirada para envio.',
    type: Message,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou mídia não encontrada.',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Proibido.' })
  @ApiResponse({ status: 404, description: 'Conversa não encontrada.' })
  create(@Body() createMessageDto: CreateMessageDto, @Request() req) {
    return this.messagesService.create(
      createMessageDto,
      req.user.tenantId,
      req.user.userId,
    );
  }

  @Post('batch')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT)
  @ApiOperation({
    summary: 'Enviar múltiplas mensagens',
    description: `
Envia múltiplas mensagens de uma vez (útil para álbuns de fotos).

**Exemplo: Enviar 3 fotos**
\`\`\`json
{
  "conversationId": "uuid",
  "messages": [
    {
      "type": "IMAGE",
      "mediaId": "abc-123",
      "content": "Foto 1"
    },
    {
      "type": "IMAGE",
      "mediaId": "def-456",
      "content": "Foto 2"
    },
    {
      "type": "IMAGE",
      "mediaId": "ghi-789",
      "content": "Foto 3"
    }
  ]
}
\`\`\`

**Fluxo completo:**
1. Upload múltiplos arquivos: POST /storage/upload/batch
2. Enviar múltiplas mensagens: POST /messages/batch
    `,
  })
  @ApiResponse({
    status: 201,
    description: 'Mensagens enviadas com sucesso. Retorna array de mensagens.',
    type: [Message],
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Proibido.' })
  @ApiResponse({ status: 404, description: 'Conversa não encontrada.' })
  async createBatch(@Body() batchDto: BatchMessageDto, @Request() req) {
    const results = [];

    for (const messageDto of batchDto.messages) {
      const message = await this.messagesService.create(
        {
          ...messageDto,
          conversationId: batchDto.conversationId,
        } as CreateMessageDto,
        req.user.tenantId,
        req.user.userId,
      );
      results.push(message);
    }

    return results;
  }

  @Get('conversation/:conversationId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT)
  @ApiOperation({ summary: 'Listar histórico de mensagens' })
  @ApiResponse({
    status: 200,
    description: 'Histórico retornado com sucesso.',
    type: [Message],
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Proibido.' })
  @ApiResponse({ status: 404, description: 'Conversa não encontrada.' })
  findByConversation(
    @Param('conversationId') conversationId: string,
    @Request() req,
  ) {
    return this.messagesService.findByConversation(
      conversationId,
      req.user.tenantId,
    );
  }

  @Post('forward')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT)
  @ApiOperation({ summary: 'Encaminhar mensagem' })
  @ApiBody({ type: ForwardMessageDto })
  @ApiResponse({
    status: 201,
    description: 'Mensagem encaminhada com sucesso.',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Mensagem original não encontrada.' })
  async forwardMessage(@Body() forwardDto: ForwardMessageDto, @Request() req) {
    return this.messagesService.forwardMessage(
      forwardDto,
      req.user.tenantId,
      req.user.userId,
    );
  }

  @Post('forward/batch')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT)
  @ApiOperation({ summary: 'Encaminhar múltiplas mensagens' })
  @ApiBody({ type: ForwardBatchDto })
  @ApiResponse({
    status: 201,
    description: 'Mensagens encaminhadas com sucesso.',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  async forwardBatch(@Body() forwardBatchDto: ForwardBatchDto, @Request() req) {
    return this.messagesService.forwardBatch(
      forwardBatchDto,
      req.user.tenantId,
      req.user.userId,
    );
  }
}
