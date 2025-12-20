import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Tenant } from './entities/tenant.entity';

@ApiTags('Tenants')
@ApiBearerAuth()
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) { }

  @Post()
  @ApiOperation({ summary: 'Criar um novo Tenant (Empresa)' })
  @ApiResponse({ status: 201, description: 'Tenant criado com sucesso.', type: Tenant })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Proibido.' })
  create(@Body() createTenantDto: CreateTenantDto) {
    return this.tenantsService.create(createTenantDto);
  }

  @Get()
  @Roles()
  @ApiOperation({ summary: 'Listar todos os Tenants' })
  @ApiResponse({ status: 200, description: 'Lista de Tenants retornada com sucesso.', type: [Tenant] })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  findAll() {
    return this.tenantsService.findAll();
  }

  @Get(':id')
  @Roles()
  @ApiOperation({ summary: 'Buscar um Tenant pelo ID' })
  @ApiResponse({ status: 200, description: 'Tenant encontrado.', type: Tenant })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Tenant não encontrado.' })
  findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }

  @Patch(':id')
  @Roles()
  @ApiOperation({ summary: 'Atualizar um Tenant' })
  @ApiResponse({ status: 200, description: 'Tenant atualizado com sucesso.', type: Tenant })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Tenant não encontrado.' })
  update(@Param('id') id: string, @Body() updateTenantDto: UpdateTenantDto) {
    return this.tenantsService.update(id, updateTenantDto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Remover um Tenant' })
  @ApiResponse({ status: 200, description: 'Tenant removido com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Proibido - Apenas ADMIN ou MANAGER.' })
  @ApiResponse({ status: 404, description: 'Tenant não encontrado.' })
  remove(@Param('id') id: string) {
    return this.tenantsService.remove(id);
  }
}
