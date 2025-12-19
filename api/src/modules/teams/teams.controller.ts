import { Controller, Get, Post, Body, Patch, Param, Delete, Request } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';

@ApiTags('teams')
@ApiBearerAuth()
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) { }

  @Post()
  @ApiOperation({ summary: 'Criar uma nova equipe' })
  create(@Body() createTeamDto: CreateTeamDto, @Request() req) {
    return this.teamsService.create(createTeamDto, req.user.tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as equipes da organização' })
  findAll(@Request() req) {
    return this.teamsService.findAll(req.user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhes da equipe e seus membros' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.teamsService.findOne(id, req.user.tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar equipe' })
  update(@Param('id') id: string, @Body() updateTeamDto: UpdateTeamDto, @Request() req) {
    return this.teamsService.update(id, updateTeamDto, req.user.tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover uma equipe' })
  remove(@Param('id') id: string, @Request() req) {
    return this.teamsService.remove(id, req.user.tenantId);
  }

  @Post(':id/members/:userId')
  @ApiOperation({ summary: 'Adicionar usuário à equipe' })
  addMember(@Param('id') id: string, @Param('userId') userId: string, @Request() req) {
    return this.teamsService.addMember(id, userId, req.user.tenantId);
  }

  @Delete(':id/members/:userId')
  @ApiOperation({ summary: 'Remover usuário da equipe' })
  removeMember(@Param('id') id: string, @Param('userId') userId: string, @Request() req) {
    return this.teamsService.removeMember(id, userId, req.user.tenantId);
  }
}