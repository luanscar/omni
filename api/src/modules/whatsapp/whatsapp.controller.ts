import { Controller, Get, Post, Param, } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { ApiOperation } from '@nestjs/swagger';

@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) { }

  @Post(':channelId/start')
  @ApiOperation({ summary: 'Inicia uma sessão e gera o QR Code' })
  async startSession(@Param('channelId') channelId: string) {
    // TODO: Verificar se o channelId pertence ao tenant do usuário (segurança)
    return this.whatsappService.startSession(channelId);
  }

  @Get(':channelId/status')
  @ApiOperation({ summary: 'Retorna o status da conexão e o QR Code (se houver)' })
  async getStatus(@Param('channelId') channelId: string) {
    return this.whatsappService.getSessionStatus(channelId);
  }

  @Post(':channelId/logout')
  @ApiOperation({ summary: 'Desconecta e limpa a sessão' })
  async logout(@Param('channelId') channelId: string) {
    return this.whatsappService.logout(channelId);
  }
}
