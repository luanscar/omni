import { Injectable } from '@nestjs/common';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateTenantDto) {
    const existing = await this.prisma.tenants.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      throw new Error('Tenant with this slug already exists');
    }

    return this.prisma.tenants.create({
      data,
    });
  }

  findAll() {
    return this.prisma.tenants.findMany();
  }

  findOne(id: string) {
    return this.prisma.tenants.findUnique({
      where: { id },
      include: {
        users: true, // Inclui usuários retornados para visualização (cuidado em prod)
        channels: true,
      },
    });
  }

  update(id: string, data: UpdateTenantDto) {
    return this.prisma.tenants.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.tenants.delete({
      where: { id },
    });
  }
}
