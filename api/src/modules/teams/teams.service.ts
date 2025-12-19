import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) { }

  async create(createTeamDto: CreateTeamDto, tenantId: string) {
    const { memberIds, ...data } = createTeamDto;

    let membersConnect = [];
    if (memberIds && memberIds.length > 0) {
      // Verifica se todos os usuários pertencem ao mesmo Tenant
      const count = await this.prisma.user.count({
        where: {
          id: { in: memberIds },
          tenantId: tenantId,
        },
      });

      if (count !== memberIds.length) {
        throw new BadRequestException('Um ou mais usuários não foram encontrados ou não pertencem à sua organização.');
      }

      membersConnect = memberIds.map((id) => ({ id }));
    }

    return this.prisma.team.create({
      data: {
        ...data,
        tenantId,
        users: {
          connect: membersConnect,
        },
      },
      include: {
        users: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
  }

  findAll(tenantId: string) {
    return this.prisma.team.findMany({
      where: { tenantId },
      include: {
        _count: { select: { users: true } },
        users: {
          take: 5,
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });
  }

  async findOne(id: string, tenantId: string) {
    const team = await this.prisma.team.findFirst({
      where: { id, tenantId },
      include: {
        users: {
          select: { id: true, name: true, email: true, role: true, avatarUrl: true },
        },
      },
    });

    if (!team) {
      throw new NotFoundException('Equipe não encontrada.');
    }

    return team;
  }

  async update(id: string, updateTeamDto: UpdateTeamDto, tenantId: string) {
    await this.findOne(id, tenantId);

    const { memberIds, ...data } = updateTeamDto;
    const updateData: any = { ...data };

    if (memberIds) {
      const count = await this.prisma.user.count({
        where: { id: { in: memberIds }, tenantId },
      });
      if (count !== memberIds.length) {
        throw new BadRequestException('Usuários inválidos fornecidos.');
      }

      // Substitui a lista de membros atual pela nova
      updateData.users = {
        set: memberIds.map((uid) => ({ id: uid })),
      };
    }

    return this.prisma.team.update({
      where: { id },
      data: updateData,
      include: {
        users: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.team.delete({ where: { id } });
  }

  async addMember(teamId: string, userId: string, tenantId: string) {
    await this.findOne(teamId, tenantId);

    const user = await this.prisma.user.findFirst({ where: { id: userId, tenantId } });
    if (!user) throw new NotFoundException('Usuário não encontrado.');

    return this.prisma.team.update({
      where: { id: teamId },
      data: { users: { connect: { id: userId } } },
    });
  }

  async removeMember(teamId: string, userId: string, tenantId: string) {
    await this.findOne(teamId, tenantId);
    return this.prisma.team.update({
      where: { id: teamId },
      data: { users: { disconnect: { id: userId } } },
    });
  }
}
