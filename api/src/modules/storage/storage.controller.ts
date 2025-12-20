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
  @ApiOperation({
    summary: 'Upload de arquivo (imagens, vídeos, documentos)',
    description: `
Faz upload de um arquivo para uso em mensagens.

**Tipos suportados:**
- Imagens: JPG, PNG, GIF, WEBP
- Vídeos: MP4, AVI, MOV
- Áudios: MP3, OGG, WAV
- Documentos: PDF, DOC, DOCX, XLS, XLSX
- Outros: ZIP, RAR, etc.

**Resposta de sucesso:**
\`\`\`json
{
  "id": "abc-123-def-456",
  "fileName": "arquivo_123456789.jpg",
  "originalName": "foto.jpg",
  "mimeType": "image/jpeg",
  "size": 245678,
  "publicUrl": "/storage/abc-123-def-456/download"
}
\`\`\`

**Como usar:**
1. Faça upload do arquivo aqui
2. Copie o "id" retornado
3. Use como "mediaId" ao enviar mensagem
    `
  })
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
  @ApiResponse({ status: 201, description: 'Arquivo enviado com sucesso. Retorna objeto Media com id, fileName, size, etc.' })
  @ApiResponse({ status: 400, description: 'Arquivo inválido ou muito grande.' })
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

  @Post('upload/batch')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT)
  @ApiOperation({
    summary: 'Upload de múltiplos arquivos',
    description: `
Faz upload de múltiplos arquivos de uma vez.

**Resposta de sucesso:**
\`\`\`json
[
  {
    "id": "abc-123",
    "fileName": "arquivo1.jpg",
    "mimeType": "image/jpeg",
    "size": 245678
  },
  {
    "id": "def-456",
    "fileName": "arquivo2.pdf",
    "mimeType": "application/pdf",
    "size": 123456
  }
]
\`\`\`

**Como usar:**
1. Envie múltiplos arquivos no campo "files"
2. Receba array com todos os mediaIds
3. Use os IDs para enviar múltiplas mensagens
    `
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Múltiplos arquivos',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Arquivos enviados com sucesso. Retorna array de objetos Media.' })
  @ApiResponse({ status: 400, description: 'Um ou mais arquivos inválidos.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Proibido.' })
  async uploadBatch(@Req() req: FastifyRequest, @Request() requestUser: any) {
    const files = req.files();
    const results = [];

    for await (const file of files) {
      const media = await this.storageService.uploadFile(
        file,
        requestUser.user.tenantId,
        requestUser.user.userId
      );
      results.push(media);
    }

    return results;
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT)
  @ApiOperation({
    summary: 'Listar todos os arquivos',
    description: 'Retorna lista de todos os arquivos enviados pelo seu tenant, ordenados por data de upload (mais recentes primeiro).'
  })
  @ApiResponse({ status: 200, description: 'Lista de arquivos com id, fileName, size, mimeType, createdAt, etc.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Proibido.' })
  findAll(@Request() req) {
    return this.storageService.findAll(req.user.tenantId);
  }

  @Get(':id/download')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT)
  @ApiOperation({
    summary: 'Obter URL de download',
    description: `
Gera URL assinada temporária para download ou visualização do arquivo.

**Exemplo de resposta:**
\`\`\`json
{
  "url": "https://storage.example.com/abc-123.jpg?token=...",
  "fileName": "foto.jpg",
  "mimeType": "image/jpeg",
  "originalName": "minha_foto.jpg"
}
\`\`\`

A URL é válida por tempo limitado (presigned URL).
    `
  })
  @ApiResponse({ status: 200, description: 'URL gerada com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Proibido.' })
  @ApiResponse({ status: 404, description: 'Arquivo não encontrado.' })
  getDownloadUrl(@Param('id') id: string, @Request() req) {
    return this.storageService.getDownloadUrl(id, req.user.tenantId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Remover arquivo permanentemente',
    description: '⚠️ **ATENÇÃO:** Esta ação é irreversível! O arquivo será removido permanentemente do storage e do banco de dados.'
  })
  @ApiResponse({ status: 200, description: 'Arquivo removido com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Proibido - Apenas ADMIN e MANAGER.' })
  @ApiResponse({ status: 404, description: 'Arquivo não encontrado.' })
  remove(@Param('id') id: string, @Request() req) {
    return this.storageService.remove(id, req.user.tenantId);
  }
}