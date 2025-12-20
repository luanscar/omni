import { Controller, Get, Post, Body, Patch, Param, Delete, Request } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { Contact } from './entities/contact.entity';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from 'prisma/generated/enums';

@ApiTags('Contacts')
@ApiBearerAuth()
@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) { }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT)
  @ApiOperation({ summary: 'Criar um novo contato' })
  @ApiResponse({ status: 201, description: 'Contato criado com sucesso.', type: Contact })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Proibido.' })
  create(@Body() createContactDto: CreateContactDto, @Request() req) {
    return this.contactsService.create(createContactDto, req.user.tenantId);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT)
  @ApiOperation({ summary: 'Listar todos os contatos' })
  @ApiResponse({ status: 200, description: 'Lista de contatos retornada com sucesso.', type: [Contact] })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Proibido.' })
  findAll(@Request() req) {
    return this.contactsService.findAll(req.user.tenantId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT)
  @ApiOperation({ summary: 'Detalhes de um contato' })
  @ApiResponse({ status: 200, description: 'Contato encontrado.', type: Contact })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Proibido.' })
  @ApiResponse({ status: 404, description: 'Contato não encontrado.' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.contactsService.findOne(id, req.user.tenantId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT)
  @ApiOperation({ summary: 'Atualizar contato' })
  @ApiResponse({ status: 200, description: 'Contato atualizado com sucesso.', type: Contact })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Proibido.' })
  @ApiResponse({ status: 404, description: 'Contato não encontrado.' })
  update(@Param('id') id: string, @Body() updateContactDto: UpdateContactDto, @Request() req) {
    return this.contactsService.update(id, updateContactDto, req.user.tenantId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Remover um contato' })
  @ApiResponse({ status: 200, description: 'Contato removido com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Proibido.' })
  @ApiResponse({ status: 404, description: 'Contato não encontrado.' })
  remove(@Param('id') id: string, @Request() req) {
    return this.contactsService.remove(id, req.user.tenantId);
  }
}