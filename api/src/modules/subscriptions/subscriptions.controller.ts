import {
    Controller,
    Get,
    Post,
    Body,
    Delete,
    UseGuards,
    Request,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { Subscription } from './entities/subscription.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'prisma/generated/enums';
import { RolesGuard } from '../auth/roles.guard';

@ApiTags('Subscriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('subscriptions')
export class SubscriptionsController {
    constructor(private readonly subscriptionsService: SubscriptionsService) { }

    @Post('checkout')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Criar uma sessão de checkout' })
    @ApiResponse({
        status: 201,
        description: 'Sessão de checkout criada com sucesso.',
    })
    @ApiResponse({ status: 400, description: 'Dados inválidos.' })
    @ApiResponse({ status: 401, description: 'Não autorizado.' })
    @ApiResponse({ status: 403, description: 'Proibido.' })
    createCheckout(@Body() dto: CreateCheckoutSessionDto, @Request() req) {
        return this.subscriptionsService.createCheckoutSession(
            req.user.tenantId,
            dto.planId,
            dto.successUrl,
            dto.cancelUrl,
        );
    }

    @Get('my-subscription')
    @ApiOperation({ summary: 'Buscar assinatura do tenant' })
    @ApiResponse({
        status: 200,
        description: 'Assinatura encontrada.',
        type: Subscription,
    })
    @ApiResponse({ status: 401, description: 'Não autorizado.' })
    @ApiResponse({ status: 404, description: 'Assinatura não encontrada.' })
    findMySubscription(@Request() req) {
        return this.subscriptionsService.findByTenant(req.user.tenantId);
    }

    @Delete('cancel')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Cancelar assinatura' })
    @ApiResponse({
        status: 200,
        description: 'Assinatura cancelada com sucesso.',
    })
    @ApiResponse({ status: 401, description: 'Não autorizado.' })
    @ApiResponse({ status: 403, description: 'Proibido.' })
    @ApiResponse({ status: 404, description: 'Assinatura não encontrada.' })
    cancel(@Request() req) {
        return this.subscriptionsService.cancelSubscription(req.user.tenantId);
    }
}
