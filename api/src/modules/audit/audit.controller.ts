import { Controller, Get, Query, Param, Request } from '@nestjs/common';
import { AuditService } from './audit.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, AuditEventType, AuditStatus } from 'prisma/generated/enums';
import { PrismaService } from '../../prisma.service';

@ApiTags('Audit')
@ApiBearerAuth()
@Controller('audit')
export class AuditController {
    constructor(
        private auditService: AuditService,
        private prisma: PrismaService
    ) { }

    @Get('logs')
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    @ApiOperation({
        summary: 'Listar logs de auditoria',
        description: 'Retorna lista de eventos auditados com filtros opcionais'
    })
    @ApiQuery({ name: 'eventType', required: false, enum: AuditEventType })
    @ApiQuery({ name: 'module', required: false, type: String })
    @ApiQuery({ name: 'status', required: false, enum: AuditStatus })
    @ApiQuery({ name: 'startDate', required: false, type: String })
    @ApiQuery({ name: 'endDate', required: false, type: String })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'offset', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'Lista de logs retornada com sucesso' })
    @ApiResponse({ status: 401, description: 'Não autorizado' })
    @ApiResponse({ status: 403, description: 'Sem permissão' })
    async getLogs(
        @Query('eventType') eventType?: AuditEventType,
        @Query('module') module?: string,
        @Query('status') status?: AuditStatus,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
        @Request() req?,
    ) {
        return this.auditService.findLogs({
            tenantId: req.user.tenantId,
            eventType,
            module,
            status,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            limit: limit ? parseInt(limit) : undefined,
            offset: offset ? parseInt(offset) : undefined,
        });
    }

    @Get('stats')
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    @ApiOperation({
        summary: 'Estatísticas de auditoria',
        description: 'Retorna estatísticas agregadas dos eventos auditados em um período'
    })
    @ApiQuery({ name: 'startDate', required: true, type: String })
    @ApiQuery({ name: 'endDate', required: true, type: String })
    @ApiResponse({ status: 200, description: 'Estatísticas retornadas com sucesso' })
    @ApiResponse({ status: 401, description: 'Não autorizado' })
    @ApiResponse({ status: 403, description: 'Sem permissão' })
    async getStats(
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
        @Request() req,
    ) {
        return this.auditService.getStats(
            req.user.tenantId,
            new Date(startDate),
            new Date(endDate),
        );
    }

    @Get('logs/:id')
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    @ApiOperation({
        summary: 'Detalhes de um log específico',
        description: 'Retorna informações completas de um evento de auditoria'
    })
    @ApiResponse({ status: 200, description: 'Detalhes do log retornados' })
    @ApiResponse({ status: 401, description: 'Não autorizado' })
    @ApiResponse({ status: 403, description: 'Sem permissão' })
    @ApiResponse({ status: 404, description: 'Log não encontrado' })
    async getLogDetails(@Param('id') id: string, @Request() req) {
        return this.prisma.auditLog.findFirst({
            where: {
                id,
                tenantId: req.user.tenantId
            },
            include: {
                user: { select: { name: true, email: true } },
            },
        });
    }
}
