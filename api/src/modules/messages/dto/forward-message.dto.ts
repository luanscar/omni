import {
  IsUUID,
  IsNotEmpty,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForwardMessageDto {
  @ApiProperty({
    example: 'abc-123-def-456',
    description: 'ID da mensagem a ser encaminhada',
  })
  @IsUUID(undefined, { message: 'O ID da mensagem deve ser um UUID válido' })
  @IsNotEmpty({ message: 'O ID da mensagem não pode estar vazio' })
  messageId: string;

  @ApiProperty({
    example: ['conv-1', 'conv-2'],
    description: 'IDs das conversas de destino (máximo 10)',
    type: [String],
    maxItems: 10,
  })
  @IsArray({ message: 'As conversas de destino devem estar em um array' })
  @IsUUID('4', {
    each: true,
    message: 'Cada ID de conversa deve ser um UUID válido',
  })
  @ArrayMinSize(1, { message: 'Deve haver pelo menos uma conversa de destino' })
  @ArrayMaxSize(10, { message: 'Máximo de 10 conversas de destino' })
  targetConversationIds: string[];
}

export class ForwardBatchDto {
  @ApiProperty({
    example: ['msg-1', 'msg-2', 'msg-3'],
    description: 'IDs das mensagens a serem encaminhadas (máximo 50)',
    type: [String],
    maxItems: 50,
  })
  @IsArray({ message: 'As mensagens devem estar em um array' })
  @IsUUID('4', {
    each: true,
    message: 'Cada ID de mensagem deve ser um UUID válido',
  })
  @ArrayMinSize(1, { message: 'Deve haver pelo menos uma mensagem' })
  @ArrayMaxSize(50, { message: 'Máximo de 50 mensagens por vez' })
  messageIds: string[];

  @ApiProperty({
    example: ['conv-x', 'conv-y'],
    description: 'IDs das conversas de destino (máximo 10)',
    type: [String],
    maxItems: 10,
  })
  @IsArray({ message: 'As conversas de destino devem estar em um array' })
  @IsUUID('4', {
    each: true,
    message: 'Cada ID de conversa deve ser um UUID válido',
  })
  @ArrayMinSize(1, { message: 'Deve haver pelo menos uma conversa de destino' })
  @ArrayMaxSize(10, { message: 'Máximo de 10 conversas de destino' })
  targetConversationIds: string[];
}
