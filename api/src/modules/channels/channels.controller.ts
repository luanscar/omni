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
import { ChannelsService } from './channels.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Channel } from './entities/channel.entity';

@ApiTags('Channels')
@ApiBearerAuth()
@Controller('channels')
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar um novo canal de comunicação' })
  @ApiResponse({
    status: 201,
    description: 'Canal criado com sucesso.',
    type: Channel,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  create(@Body() createChannelDto: CreateChannelDto, @Request() req) {
    // O tenantId vem automaticamente do JWT (injetado pelo JwtStrategy)
    return this.channelsService.create(createChannelDto, req.user.tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os canais da sua empresa' })
  @ApiResponse({
    status: 200,
    description: 'Lista de canais retornada com sucesso.',
    type: [Channel],
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  findAll(@Request() req) {
    return this.channelsService.findAll(req.user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar detalhes de um canal específico' })
  @ApiResponse({ status: 200, description: 'Canal encontrado.', type: Channel })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Canal não encontrado.' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.channelsService.findOne(id, req.user.tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar configurações do canal' })
  @ApiResponse({
    status: 200,
    description: 'Canal atualizado com sucesso.',
    type: Channel,
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Canal não encontrado.' })
  update(
    @Param('id') id: string,
    @Body() updateChannelDto: UpdateChannelDto,
    @Request() req,
  ) {
    return this.channelsService.update(id, updateChannelDto, req.user.tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover um canal' })
  @ApiResponse({ status: 200, description: 'Canal removido com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Canal não encontrado.' })
  remove(@Param('id') id: string, @Request() req) {
    return this.channelsService.remove(id, req.user.tenantId);
  }
}
