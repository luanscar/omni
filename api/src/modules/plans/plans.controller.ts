import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { PlansService } from './plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { SubscriptionPlan } from './entities/plan.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'prisma/generated/enums';
import { RolesGuard } from '../auth/roles.guard';

@ApiTags('Plans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('plans')
export class PlansController {
    constructor(private readonly plansService: PlansService) { }

    @Post()
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Criar um novo plano' })
    @ApiResponse({
        status: 201,
        description: 'Plano criado com sucesso.',
        type: SubscriptionPlan,
    })
    @ApiResponse({ status: 400, description: 'Dados inválidos.' })
    @ApiResponse({ status: 401, description: 'Não autorizado.' })
    @ApiResponse({ status: 403, description: 'Proibido.' })
    @ApiResponse({
        status: 409,
        description: 'Já existe um plano deste tipo.'
    })
    create(@Body() createPlanDto: CreatePlanDto) {
        return this.plansService.create(createPlanDto);
    }

    @Get()
    @ApiOperation({ summary: 'Listar todos os planos' })
    @ApiResponse({
        status: 200,
        description: 'Lista de planos retornada com sucesso.',
        type: [SubscriptionPlan],
    })
    @ApiResponse({ status: 401, description: 'Não autorizado.' })
    findAll() {
        return this.plansService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Buscar um plano pelo ID' })
    @ApiResponse({
        status: 200,
        description: 'Plano encontrado.',
        type: SubscriptionPlan,
    })
    @ApiResponse({ status: 401, description: 'Não autorizado.' })
    @ApiResponse({ status: 404, description: 'Plano não encontrado.' })
    findOne(@Param('id') id: string) {
        return this.plansService.findOne(id);
    }

    @Patch(':id')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Atualizar um plano' })
    @ApiResponse({
        status: 200,
        description: 'Plano atualizado com sucesso.',
        type: SubscriptionPlan,
    })
    @ApiResponse({ status: 400, description: 'Dados inválidos.' })
    @ApiResponse({ status: 401, description: 'Não autorizado.' })
    @ApiResponse({ status: 403, description: 'Proibido.' })
    @ApiResponse({ status: 404, description: 'Plano não encontrado.' })
    update(@Param('id') id: string, @Body() updatePlanDto: UpdatePlanDto) {
        return this.plansService.update(id, updatePlanDto);
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Remover um plano' })
    @ApiResponse({ status: 200, description: 'Plano removido com sucesso.' })
    @ApiResponse({ status: 401, description: 'Não autorizado.' })
    @ApiResponse({ status: 403, description: 'Proibido.' })
    @ApiResponse({ status: 404, description: 'Plano não encontrado.' })
    remove(@Param('id') id: string) {
        return this.plansService.remove(id);
    }
}
