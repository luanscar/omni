import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, IsNumber, IsObject, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MessageType } from 'prisma/generated/enums';

class LocationMessageDto {
    @ApiProperty({ example: -23.550520 })
    @IsNumber()
    degreesLatitude: number;

    @ApiProperty({ example: -46.633308 })
    @IsNumber()
    degreesLongitude: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    address?: string;
}

class ContactMessageDto {
    @ApiProperty()
    @IsString()
    displayName: string;

    @ApiProperty({ description: 'Conteúdo vCard do contato' })
    @IsString()
    vcard: string;
}

class ReactionMessageDto {
    @ApiProperty({ example: '❤️' })
    @IsString()
    text: string;

    @ApiProperty({ description: 'ID da mensagem que receberá a reação' })
    @IsUUID()
    key: string;
}

export class CreateMessageDto {
    @ApiProperty({ example: 'uuid-da-conversa', description: 'ID da conversa' })
    @IsNotEmpty()
    @IsUUID()
    conversationId: string;

    @ApiProperty({ enum: MessageType, description: 'Tipo da mensagem', default: MessageType.TEXT })
    @IsEnum(MessageType)
    type: MessageType = MessageType.TEXT;

    @ApiProperty({ description: 'Conteúdo de texto ou legenda da mídia', required: false })
    @IsOptional()
    @IsString()
    content?: string;

    @ApiProperty({ description: 'ID da mídia (para IMAGE, VIDEO, AUDIO, DOCUMENT, STICKER)', required: false })
    @ValidateIf(o => [MessageType.IMAGE, MessageType.VIDEO, MessageType.AUDIO, MessageType.DOCUMENT, MessageType.STICKER].includes(o.type))
    @IsNotEmpty({ message: 'mediaId é obrigatório para mensagens de mídia' })
    @IsUUID()
    mediaId?: string;

    @ApiProperty({ description: 'ID da mensagem que está sendo respondida (Reply)', required: false })
    @IsOptional()
    @IsUUID()
    replyToId?: string;

    // --- Campos Específicos ---

    @ApiProperty({ type: LocationMessageDto, required: false })
    @ValidateIf(o => o.type === MessageType.LOCATION)
    @IsNotEmpty()
    @IsObject()
    location?: LocationMessageDto;

    @ApiProperty({ type: ContactMessageDto, required: false })
    @ValidateIf(o => o.type === MessageType.CONTACT)
    @IsNotEmpty()
    @IsObject()
    contact?: ContactMessageDto;

    @ApiProperty({ type: ReactionMessageDto, required: false })
    @ValidateIf(o => o.type === MessageType.REACTION)
    @IsNotEmpty()
    @IsObject()
    reaction?: ReactionMessageDto;
}