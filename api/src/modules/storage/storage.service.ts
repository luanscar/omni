import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
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

  async onModuleInit() { }

  // Atualizado para aceitar uploaderId nulo (upload de sistema)
  async uploadFile(file: any, tenantId: string, uploaderId?: string | null) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado.');
    }

    // Se file.filename vier vazio, tenta gerar um nome
    const originalName = file.filename || 'file.bin';
    const fileExtension = path.extname(originalName) || '.jpg';
    const fileName = `${uuidv4()}${fileExtension}`;
    const key = `${tenantId}/${fileName}`;

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
          uploaderId: uploaderId || null, // Garante null se for undefined
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

  async getDownloadUrl(id: string, tenantId: string) {
    const media = await this.findOne(id, tenantId);

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: media.key,
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
      return { url, ...media };
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