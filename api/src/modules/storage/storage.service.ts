import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PrismaService } from '../../prisma.service';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

@Injectable()
export class StorageService implements OnModuleInit {
  private s3Client: S3Client;
  private bucketName = 'omni-bucket';

  constructor(private prisma: PrismaService) {
    // Configuração para LocalStack ou AWS Real
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

  async onModuleInit() {
    // Em produção, crie o bucket via Terraform/Console.
    // Aqui no dev, podemos tentar criar se não existir (opcional),
    // mas geralmente o script de init do LocalStack faz isso.
  }

  async uploadFile(file: any, tenantId: string, uploaderId: string) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado.');
    }

    const fileExtension = path.extname(file.filename);
    const fileName = `${uuidv4()}${fileExtension}`;
    const key = `${tenantId}/${fileName}`; // Organiza pastas por Tenant

    try {
      // Bufferiza o arquivo (para arquivos gigantes, streams são melhores, 
      // mas o buffer simplifica o cálculo do tamanho aqui)
      const buffer = await file.toBuffer();

      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: buffer,
          ContentType: file.mimetype,
        }),
      );

      // Salva metadados no banco
      const media = await this.prisma.media.create({
        data: {
          fileName: fileName,
          originalName: file.filename,
          mimeType: file.mimetype,
          size: buffer.length,
          key: key,
          tenantId,
          uploaderId,
        },
      });

      return media;
    } catch (error) {
      console.error('Erro no upload S3:', error);
      throw new InternalServerErrorException('Falha ao fazer upload do arquivo.');
    }
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

  // Gera uma URL temporária (assinada) para download seguro
  async getDownloadUrl(id: string, tenantId: string) {
    const media = await this.findOne(id, tenantId);

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: media.key,
      });

      // URL válida por 1 hora
      const url = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
      return { url, ...media };
    } catch (error) {
      throw new InternalServerErrorException('Erro ao gerar URL de download.');
    }
  }

  async remove(id: string, tenantId: string) {
    const media = await this.findOne(id, tenantId);

    // 1. Remove do S3
    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: media.key,
        }),
      );
    } catch (error) {
      console.error('Erro ao deletar do S3:', error);
      // Podemos continuar para deletar do banco mesmo se falhar no S3 (evita registros fantasmas)
    }

    // 2. Remove do Banco
    return this.prisma.media.delete({
      where: { id },
    });
  }
}