import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMessageDto {
    @ApiProperty({ example: 'uuid-da-conversa', description: 'ID da conversa onde a mensagem será enviada' })
    @IsNotEmpty({ message: 'O ID da conversa é obrigatório' })
    @IsUUID()
    conversationId: string;

    @ApiProperty({ example: 'Olá, como posso ajudar?', description: 'Conteúdo de texto da mensagem', required: false })
    @IsOptional()
    @IsString()
    content?: string;

    @ApiProperty({ example: 'uuid-do-media', description: 'ID do arquivo de mídia (opcional)', required: false })
    @IsOptional()
    @IsUUID()
    mediaId?: string;
}