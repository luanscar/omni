import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from 'src/common/decorators/public.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuditService } from '../audit/audit.service';
import { AuditStatus, AuditEventType } from 'prisma/generated/enums';
import { FastifyRequest } from 'fastify';

@ApiTags('Auth')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly auditService: AuditService,
  ) {}

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Realizar login' })
  @ApiResponse({ status: 200, description: 'Login realizado com sucesso.' })
  @ApiResponse({
    status: 401,
    description: 'Credenciais inválidas ou não autorizado.',
  })
  async login(@Body() loginDto: LoginDto, @Req() req: FastifyRequest) {
    try {
      const result = await this.authService.login(loginDto);

      // ✅ Log de login bem-sucedido
      await this.auditService.logUserAction({
        tenantId: result.user.tenantId,
        userId: result.user.id,
        action: 'user.login',
        details: { email: loginDto.email },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return result;
    } catch (error) {
      // ❌ Log de falha de login
      await this.auditService.log({
        tenantId: 'UNKNOWN', // Antes de autenticar
        eventType: AuditEventType.AUTH,
        module: 'auth',
        action: 'user.login.failed',
        details: { email: loginDto.email },
        status: AuditStatus.FAILED,
        errorMessage: error.message,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      throw error;
    }
  }
}
