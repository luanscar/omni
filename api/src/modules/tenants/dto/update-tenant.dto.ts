import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsObject, IsOptional } from 'class-validator';
import { CreateTenantDto } from './create-tenant.dto';

export class UpdateTenantDto extends PartialType(CreateTenantDto) {
  @ApiProperty({
    description:
      'Configurações customizadas do tenant (tema, modo de chat, etc)',
    required: false,
    example: { chatMode: 'ATTENDANCE', theme: { primaryColor: '#3b82f6' } },
  })
  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;
}
