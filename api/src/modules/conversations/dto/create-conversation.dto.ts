import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateConversationDto {
    // Para criar um atendimento ativo (Agente inicia com Cliente)
    @ApiProperty({ example: 'uuid-do-contato', description: 'ID do contato (para atendimentos)', required: false })
    @IsOptional()
    @IsUUID()
    contactId?: string;

    @ApiProperty({ example: 'uuid-do-canal', description: 'ID do canal de origem (WhatsApp, etc)', required: false })
    @IsOptional()
    @IsUUID()
    channelId?: string;

    // Para criar um chat de equipe
    @ApiProperty({ example: 'uuid-do-time', description: 'ID do time (para chat interno)', required: false })
    @IsOptional()
    @IsUUID()
    teamId?: string;
}