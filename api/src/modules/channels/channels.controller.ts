import { Controller, Get, Post, Body, Patch, Param, Delete, Request } from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Channels')
@ApiBearerAuth()
@Controller('channels')
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) { }

  @Post()
  @ApiOperation({ summary: 'Criar um novo canal de comunicação' })
  create(@Body() createChannelDto: CreateChannelDto, @Request() req) {
    // O tenantId vem automaticamente do JWT (injetado pelo JwtStrategy)
    return this.channelsService.create(createChannelDto, req.user.tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os canais da sua empresa' })
  findAll(@Request() req) {
    return this.channelsService.findAll(req.user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar detalhes de um canal específico' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.channelsService.findOne(id, req.user.tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar configurações do canal' })
  update(@Param('id') id: string, @Body() updateChannelDto: UpdateChannelDto, @Request() req) {
    return this.channelsService.update(id, updateChannelDto, req.user.tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover um canal' })
  remove(@Param('id') id: string, @Request() req) {
    return this.channelsService.remove(id, req.user.tenantId);
  }
}
