import { Controller, Get, Post, Param, HttpStatus, Res, } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { ApiOperation, ApiProduces, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Whatsapp')
@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) { }

  @Post(':channelId/start')
  @ApiOperation({ summary: 'Inicia uma sessão e gera o QR Code' })
  @ApiResponse({ status: 201, description: 'Sessão iniciada (QR Code gerado ou status retornado).' })
  @ApiResponse({ status: 404, description: 'Canal não encontrado.' })
  async startSession(@Param('channelId') channelId: string) {
    // TODO: Verificar se o channelId pertence ao tenant do usuário (segurança)
    return this.whatsappService.startSession(channelId);
  }

  @Get(':channelId/qr')
  @ApiOperation({ summary: 'Renderiza a imagem do QR Code (PNG)' })
  @ApiProduces('image/png')
  @ApiResponse({
    status: 200,
    description: 'Imagem do QR Code renderizada.',
    content: {
      'image/png': {
        schema: {
          type: 'string',
          format: 'binary'
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'QR Code não disponível ou sessão conectada.' })
  async getQrImage(@Param('channelId') channelId: string, @Res() res) {
    const { qrCode } = this.whatsappService.getSessionStatus(channelId);

    if (!qrCode) {
      return res.status(HttpStatus.NOT_FOUND).send({ message: 'QR Code não disponível' });
    }

    // Remove o cabeçalho do Data URL para pegar apenas os dados binários
    const base64Data = qrCode.replace(/^data:image\/png;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');

    // Define o header para o navegador/Scalar entender que é uma imagem
    res.header('Content-Type', 'image/png');
    res.header('Content-Length', buffer.length.toString());

    res.send(buffer);
  }


  @Get(':channelId/status')
  @ApiOperation({ summary: 'Retorna o status da conexão e o QR Code (se houver)' })
  @ApiResponse({ status: 200, description: 'Status retornado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Canal não encontrado.' })
  async getStatus(@Param('channelId') channelId: string) {
    return this.whatsappService.getSessionStatus(channelId);
  }

  @Post(':channelId/logout')
  @ApiOperation({ summary: 'Desconecta e limpa a sessão' })
  @ApiResponse({ status: 201, description: 'Sessão encerrada com sucesso.' })
  @ApiResponse({ status: 404, description: 'Canal não encontrado.' })
  async logout(@Param('channelId') channelId: string) {
    return this.whatsappService.logout(channelId);
  }
}
