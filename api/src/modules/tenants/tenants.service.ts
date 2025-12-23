import { ConflictException, Injectable } from '@nestjs/common';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { PrismaService } from 'src/prisma.service';
import { Prisma } from 'prisma/generated/client';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateTenantDto) {
    const existing = await this.prisma.tenant.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      throw new ConflictException('Tenant with this slug already exists');
    }

    return this.prisma.tenant.create({
      data,
    });
  }

  findAll() {
    return this.prisma.tenant.findMany();
  }

  findOne(id: string) {
    return this.prisma.tenant.findUnique({
      where: { id },
      include: {
        users: true, // Inclui usuários retornados para visualização (cuidado em prod)
        channels: true,
      },
    });
  }

  update(id: string, data: UpdateTenantDto) {
    const { settings, ...rest } = data;
    return this.prisma.tenant.update({
      where: { id },
      data: {
        ...rest,
        ...(settings !== undefined && {
          settings: settings as Prisma.InputJsonValue,
        }),
      },
    });
  }

  remove(id: string) {
    return this.prisma.tenant.delete({
      where: { id },
    });
  }
}
