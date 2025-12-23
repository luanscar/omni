import { ApiProperty } from '@nestjs/swagger';

import { IsEnum, IsOptional, IsUUID, ValidateIf } from 'class-validator';
import { ConversationStatus } from 'prisma/generated/enums';

export class UpdateConversationDto {
  @ApiProperty({
    enum: ConversationStatus,
    description: 'Novo status da conversa',
    required: false,
  })
  @IsOptional()
  @IsEnum(ConversationStatus)
  status?: ConversationStatus;

  @ApiProperty({
    example: 'uuid-do-agente',
    description:
      'ID do agente responsável (transferência). Use null para remover atribuição.',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((o) => o.assigneeId !== null)
  @IsUUID()
  assigneeId?: string | null;
}
