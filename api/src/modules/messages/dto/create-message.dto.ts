import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsNumber,
  IsObject,
  IsBoolean,
  ValidateIf,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MessageType } from 'prisma/generated/enums';

class LocationMessageDto {
  @ApiProperty({
    example: -23.55052,
    description: 'Latitude em graus decimais (ex: -23.550520 para São Paulo)',
  })
  @IsNumber()
  degreesLatitude: number;

  @ApiProperty({
    example: -46.633308,
    description: 'Longitude em graus decimais (ex: -46.633308 para São Paulo)',
  })
  @IsNumber()
  degreesLongitude: number;

  @ApiProperty({
    required: false,
    example: 'Avenida Paulista',
    description: 'Nome do local (opcional)',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    required: false,
    example: 'Av. Paulista, 1578 - Bela Vista, São Paulo - SP, 01310-100',
    description: 'Endereço completo do local (opcional)',
  })
  @IsOptional()
  @IsString()
  address?: string;
}

class ContactMessageDto {
  @ApiProperty({
    example: 'João Silva',
    description: 'Nome de exibição do contato',
  })
  @IsString()
  displayName: string;

  @ApiProperty({
    description: 'Conteúdo vCard do contato no formato padrão vCard 3.0',
    example:
      'BEGIN:VCARD\nVERSION:3.0\nFN:João Silva\nTEL;TYPE=CELL:+5511999999999\nEMAIL:joao@example.com\nEND:VCARD',
  })
  @IsString()
  vcard: string;
}

class ReactionMessageDto {
  @ApiProperty({
    example: '❤️',
    description: 'Emoji da reação (❤️, 👍, 😂, 😮, 😢, 🙏, etc.)',
  })
  @IsString()
  text: string;

  @ApiProperty({
    description:
      'ID da mensagem que receberá a reação (UUID do banco de dados, não providerId)',
    example: 'fa49178f-6595-40b9-a569-3d5c07925555',
  })
  @IsUUID()
  key: string;
}

export class CreateMessageDto {
  @ApiProperty({
    example: 'fa49178f-6595-40b9-a569-3d5c07925555',
    description: 'ID da conversa onde a mensagem será enviada',
  })
  @IsNotEmpty()
  @IsUUID()
  conversationId: string;

  @ApiProperty({
    enum: MessageType,
    description:
      'Tipo da mensagem: TEXT, IMAGE, VIDEO, AUDIO, DOCUMENT, STICKER, LOCATION, CONTACT, REACTION',
    default: MessageType.TEXT,
    example: 'TEXT',
  })
  @IsEnum(MessageType)
  type: MessageType = MessageType.TEXT;

  @ApiProperty({
    description: 'Conteúdo de texto da mensagem ou legenda para mídias',
    required: false,
    example: 'Olá, como posso ajudar?',
  })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({
    description:
      '⚠️ ID da mídia previamente enviada via POST /storage/upload. Obrigatório para IMAGE, VIDEO, AUDIO, DOCUMENT e STICKER',
    required: false,
    example: 'abc-123-def-456',
  })
  @ValidateIf((o) =>
    [
      MessageType.IMAGE,
      MessageType.VIDEO,
      MessageType.AUDIO,
      MessageType.DOCUMENT,
      MessageType.STICKER,
    ].includes(o.type),
  )
  @IsNotEmpty({ message: 'mediaId é obrigatório para mensagens de mídia' })
  @IsUUID()
  mediaId?: string;

  @ApiProperty({
    description:
      'ID da mensagem que está sendo respondida (cria um Reply/Quote)',
    required: false,
    example: 'fa49178f-6595-40b9-a569-3d5c07925555',
  })
  @IsOptional()
  @IsUUID()
  replyToId?: string;

  @ApiProperty({
    description:
      'Se true, adiciona "*Nome do Agente:*\\n" no início da mensagem',
    required: false,
    default: false,
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  signMessage?: boolean;

  // --- Campos Específicos ---

  @ApiProperty({
    type: LocationMessageDto,
    required: false,
    description: 'Dados de localização (obrigatório quando type = LOCATION)',
    example: {
      degreesLatitude: -23.55052,
      degreesLongitude: -46.633308,
      name: 'Avenida Paulista',
      address: 'Av. Paulista, 1578 - Bela Vista, São Paulo - SP',
    },
  })
  @ValidateIf((o) => o.type === MessageType.LOCATION)
  @IsNotEmpty()
  @IsObject()
  location?: LocationMessageDto;

  @ApiProperty({
    type: ContactMessageDto,
    required: false,
    description:
      'Dados do contato compartilhado (obrigatório quando type = CONTACT)',
    example: {
      displayName: 'João Silva',
      vcard:
        'BEGIN:VCARD\nVERSION:3.0\nFN:João Silva\nTEL:+5511999999999\nEND:VCARD',
    },
  })
  @ValidateIf((o) => o.type === MessageType.CONTACT)
  @IsNotEmpty()
  @IsObject()
  contact?: ContactMessageDto;

  @ApiProperty({
    type: ReactionMessageDto,
    required: false,
    description:
      '⚠️ Dados da reação (obrigatório quando type = REACTION). Reações NÃO são salvas no banco, apenas enviadas ao WhatsApp.',
    example: {
      text: '❤️',
      key: 'fa49178f-6595-40b9-a569-3d5c07925555',
    },
  })
  @ValidateIf((o) => o.type === MessageType.REACTION)
  @IsNotEmpty()
  @IsObject()
  reaction?: ReactionMessageDto;
}
