import { Controller, Get, Post, Param, Delete, Request, Req } from '@nestjs/common';
import { StorageService } from './storage.service';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { FastifyRequest } from 'fastify';
import { UserRole } from 'prisma/generated/enums';

@ApiTags('Storage')
@ApiBearerAuth()
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) { }

  @Post('upload')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT)
  @ApiOperation({ summary: 'Fazer upload de um arquivo (Media)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo a ser enviado',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Arquivo enviado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Proibido.' })
  async upload(@Req() req: FastifyRequest, @Request() requestUser: any) {
    // Método específico do fastify-multipart
    const file = await req.file();

    return this.storageService.uploadFile(
      file,
      requestUser.user.tenantId,
      requestUser.user.userId
    );
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT)
  @ApiOperation({ summary: 'Listar todos os arquivos do tenant' })
  @ApiResponse({ status: 200, description: 'Lista de arquivos.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Proibido.' })
  findAll(@Request() req) {
    return this.storageService.findAll(req.user.tenantId);
  }

  @Get(':id/download')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT)
  @ApiOperation({ summary: 'Gerar URL assinada para download/visualização' })
  @ApiResponse({ status: 200, description: 'URL gerada com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Proibido.' })
  @ApiResponse({ status: 404, description: 'Arquivo não encontrado.' })
  getDownloadUrl(@Param('id') id: string, @Request() req) {
    return this.storageService.getDownloadUrl(id, req.user.tenantId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Remover um arquivo permanentemente' })
  @ApiResponse({ status: 200, description: 'Arquivo removido.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Proibido.' })
  @ApiResponse({ status: 404, description: 'Arquivo não encontrado.' })
  remove(@Param('id') id: string, @Request() req) {
    return this.storageService.remove(id, req.user.tenantId);
  }
}