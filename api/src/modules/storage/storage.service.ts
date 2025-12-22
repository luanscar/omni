import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { PrismaService } from '../../prisma.service';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

@Injectable()
export class StorageService implements OnModuleInit {
  private s3Client: S3Client;
  private bucketName = 'omni-bucket';

  constructor(private prisma: PrismaService) {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      endpoint: process.env.AWS_ENDPOINT || 'http://localhost:4566',
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
      },
    });
  }

  async onModuleInit() {}

  // Categorias disponíveis para organização
  private readonly CATEGORIES = {
    MESSAGES: 'messages', // Mídias de mensagens WhatsApp
    AVATARS: 'avatars', // Fotos de perfil
    DOCUMENTS: 'documents', // Documentos gerais
    EXPORTS: 'exports', // Relatórios exportados
    TEMP: 'temp', // Arquivos temporários
  } as const;

  // Atualizado para aceitar category e organizar em pastas
  async uploadFile(
    file: any,
    tenantId: string,
    uploaderId?: string | null,
    category: string = 'documents', // Categoria padrão
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado.');
    }

    // Se file.filename vier vazio, tenta gerar um nome
    const originalName = file.filename || 'file.bin';
    const fileExtension = path.extname(originalName) || '.jpg';
    const fileName = `${uuidv4()}${fileExtension}`;

    // Determinar subcategoria baseada no MIME type
    const subCategory = this.getSubCategoryByMimeType(file.mimetype);

    // Estrutura: tenant-{uuid}/{category}/{subCategory}/{fileName}
    // Exemplo: tenant-abc123/messages/images/uuid.jpg
    const key = `tenant-${tenantId}/${category}/${subCategory}/${fileName}`;

    try {
      const buffer = await file.toBuffer();

      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: buffer,
          ContentType: file.mimetype,
        }),
      );

      const media = await this.prisma.media.create({
        data: {
          fileName: fileName,
          originalName: originalName,
          mimeType: file.mimetype,
          size: buffer.length,
          key: key,
          tenantId,
          uploaderId: uploaderId || null,
        },
      });

      return media;
    } catch (error) {
      console.error('Erro no upload S3:', error);
      throw new InternalServerErrorException(
        'Falha ao fazer upload do arquivo.',
      );
    }
  }

  // Helper para categorizar arquivo por MIME type
  private getSubCategoryByMimeType(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'images';
    if (mimeType.startsWith('video/')) return 'videos';
    if (mimeType.startsWith('audio/')) return 'audios';
    if (mimeType.includes('pdf') || mimeType.includes('document'))
      return 'documents';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel'))
      return 'spreadsheets';
    if (mimeType.startsWith('text/')) return 'text';
    return 'others';
  }

  async findAll(tenantId: string) {
    return this.prisma.media.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        uploader: { select: { name: true } },
      },
    });
  }

  async findOne(id: string, tenantId: string) {
    const media = await this.prisma.media.findFirst({
      where: { id, tenantId },
    });

    if (!media) throw new NotFoundException('Arquivo não encontrado.');
    return media;
  }

  async getDownloadUrl(id: string, tenantId: string) {
    const media = await this.findOne(id, tenantId);

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: media.key,
      });

      const url = await getSignedUrl(this.s3Client, command, {
        expiresIn: 3600,
      });
      return { url, ...media };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new InternalServerErrorException('Erro ao gerar URL de download.');
    }
  }

  async remove(id: string, tenantId: string) {
    const media = await this.findOne(id, tenantId);
    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: media.key,
        }),
      );
    } catch (error) {
      console.error('Erro ao deletar do S3:', error);
    }
    return this.prisma.media.delete({
      where: { id },
    });
  }
}
