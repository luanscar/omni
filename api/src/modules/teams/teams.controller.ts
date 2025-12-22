import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
} from '@nestjs/common';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { AddMemberDto } from './dto/add-member.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Team } from './entities/team.entity';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from 'prisma/generated/enums';

@ApiTags('Teams')
@ApiBearerAuth()
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  // Apenas Admins criam times novos do zero? Ou Agentes também podem criar seus times?
  // Vou manter restrito a Admin/Manager, mas você pode mudar.
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Criar uma nova equipe' })
  @ApiResponse({
    status: 201,
    description: 'Equipe criada com sucesso.',
    type: Team,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Proibido.' })
  create(@Body() createTeamDto: CreateTeamDto, @Request() req) {
    return this.teamsService.create(
      createTeamDto,
      req.user.tenantId,
      req.user.userId,
    );
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT)
  @ApiOperation({ summary: 'Listar todas as equipes' })
  @ApiResponse({
    status: 200,
    description: 'Lista de equipes retornada com sucesso.',
    type: [Team],
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Proibido.' })
  findAll(@Request() req) {
    return this.teamsService.findAll(req.user.tenantId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT)
  @ApiOperation({ summary: 'Buscar detalhes de uma equipe' })
  @ApiResponse({ status: 200, description: 'Equipe encontrada.', type: Team })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Proibido.' })
  @ApiResponse({ status: 404, description: 'Equipe não encontrada.' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.teamsService.findOne(id, req.user.tenantId);
  }

  @Patch(':id')
  // AGENT incluído aqui! A validação de liderança acontece no Service.
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT)
  @ApiOperation({ summary: 'Atualizar equipe' })
  @ApiResponse({
    status: 200,
    description: 'Equipe atualizada com sucesso.',
    type: Team,
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Sem permissão.' })
  @ApiResponse({ status: 404, description: 'Equipe não encontrada.' })
  update(
    @Param('id') id: string,
    @Body() updateTeamDto: UpdateTeamDto,
    @Request() req,
  ) {
    return this.teamsService.update(
      id,
      updateTeamDto,
      req.user.tenantId,
      req.user,
    );
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT)
  @ApiOperation({ summary: 'Remover uma equipe' })
  @ApiResponse({ status: 200, description: 'Equipe removida com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Sem permissão.' })
  @ApiResponse({ status: 404, description: 'Equipe não encontrada.' })
  remove(@Param('id') id: string, @Request() req) {
    return this.teamsService.remove(id, req.user.tenantId, req.user);
  }

  @Post(':id/members') // Rota alterada para aceitar Body com role
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT)
  @ApiOperation({ summary: 'Adicionar ou atualizar membro da equipe' })
  @ApiResponse({
    status: 201,
    description: 'Membro adicionado/atualizado com sucesso.',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Sem permissão.' })
  @ApiResponse({
    status: 404,
    description: 'Equipe ou usuário não encontrados.',
  })
  addMember(
    @Param('id') id: string,
    @Body() addMemberDto: AddMemberDto,
    @Request() req,
  ) {
    return this.teamsService.addMember(
      id,
      addMemberDto,
      req.user.tenantId,
      req.user,
    );
  }

  @Delete(':id/members/:userId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT)
  @ApiOperation({ summary: 'Remover usuário da equipe' })
  @ApiResponse({ status: 200, description: 'Membro removido com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Sem permissão.' })
  @ApiResponse({ status: 404, description: 'Membro não encontrado no time.' })
  removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Request() req,
  ) {
    return this.teamsService.removeMember(
      id,
      userId,
      req.user.tenantId,
      req.user,
    );
  }
}
