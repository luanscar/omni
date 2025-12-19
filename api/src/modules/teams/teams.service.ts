import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { TeamRole, UserRole } from 'prisma/generated/enums';
import { AddMemberDto } from './dto/add-member.dto';

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) { }

  // Auxiliar para verificar permissão
  private async ensurePermission(teamId: string, userId: string, userGlobalRole: UserRole) {
    // 1. Se for Admin ou Manager Global, tem acesso total
    if (userGlobalRole === UserRole.ADMIN || userGlobalRole === UserRole.MANAGER) {
      return true;
    }

    // 2. Se for Agent, verifica se é LEADER deste time específico
    const membership = await this.prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
    });

    if (membership && membership.role === TeamRole.ADMIN) {
      return true;
    }

    throw new ForbiddenException('Você não tem permissão para gerenciar esta equipe.');
  }

  async create(createTeamDto: CreateTeamDto, tenantId: string, creatorId: string) {
    const { memberIds, ...data } = createTeamDto;

    // Cria o time
    const team = await this.prisma.team.create({
      data: {
        ...data,
        tenantId,
      },
    });

    // Adiciona o criador como LÍDER automaticamente (se desejar essa regra)
    await this.prisma.teamMember.create({
      data: { teamId: team.id, userId: creatorId, role: TeamRole.ADMIN }
    });

    // Adiciona membros iniciais (como MEMBER padrão)
    if (memberIds && memberIds.length > 0) {
      // Validação simples de tenant
      const count = await this.prisma.user.count({
        where: { id: { in: memberIds }, tenantId },
      });
      if (count !== memberIds.length) throw new BadRequestException('Usuários inválidos.');

      await this.prisma.teamMember.createMany({
        data: memberIds.map(uid => ({
          teamId: team.id,
          userId: uid,
          role: TeamRole.MEMBER
        })),
        skipDuplicates: true
      });
    }

    return this.findOne(team.id, tenantId);
  }

  async findAll(tenantId: string) {
    return this.prisma.team.findMany({
      where: { tenantId },
      include: {
        _count: { select: { members: true } },
        members: {
          take: 5,
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } }
          }
        },
      },
    });
  }

  async findOne(id: string, tenantId: string) {
    const team = await this.prisma.team.findFirst({
      where: { id, tenantId },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, role: true, avatarUrl: true } }
          }
        },
      },
    });

    if (!team) throw new NotFoundException('Equipe não encontrada.');
    return team;
  }

  async update(id: string, updateTeamDto: UpdateTeamDto, tenantId: string, requestUser: any) {
    // Verifica permissão granular
    await this.ensurePermission(id, requestUser.userId, requestUser.role);

    const { memberIds, ...data } = updateTeamDto;

    // Atualiza dados básicos
    const team = await this.prisma.team.update({
      where: { id },
      data: data,
    });

    // Se enviou lista de membros, substitui tudo (Cuidado: isso reseta roles para MEMBER)
    // Para edição granular, use addMember/removeMember
    if (memberIds) {
      await this.prisma.teamMember.deleteMany({ where: { teamId: id } });
      await this.prisma.teamMember.createMany({
        data: memberIds.map(uid => ({
          teamId: id,
          userId: uid,
          role: TeamRole.MEMBER
        }))
      });
    }

    return this.findOne(id, tenantId);
  }

  async remove(id: string, tenantId: string, requestUser: any) {
    await this.ensurePermission(id, requestUser.userId, requestUser.role);
    return this.prisma.team.delete({ where: { id } });
  }

  async addMember(teamId: string, addMemberDto: AddMemberDto, tenantId: string, requestUser: any) {
    await this.findOne(teamId, tenantId); // Garante que time existe e é do tenant
    await this.ensurePermission(teamId, requestUser.userId, requestUser.role); // Verifica permissão

    const { userId, role } = addMemberDto;

    // Verifica se usuário a ser adicionado é do mesmo tenant
    const user = await this.prisma.user.findFirst({ where: { id: userId, tenantId } });
    if (!user) throw new NotFoundException('Usuário a ser adicionado não encontrado na organização.');

    return this.prisma.teamMember.upsert({
      where: { teamId_userId: { teamId, userId } },
      update: { role }, // Se já existe, atualiza o papel
      create: { teamId, userId, role },
    });
  }

  async removeMember(teamId: string, userId: string, tenantId: string, requestUser: any) {
    await this.findOne(teamId, tenantId);
    await this.ensurePermission(teamId, requestUser.userId, requestUser.role);

    return this.prisma.teamMember.delete({
      where: { teamId_userId: { teamId, userId } }
    });
  }
}