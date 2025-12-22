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
    description: 'ID da mensagem a ser encaminhada',
    example: 'abc-123-def-456',
  })
  @IsUUID()
  @IsNotEmpty()
  messageId: string;

  @ApiProperty({
    description: 'IDs das conversas de destino (máximo 10)',
    example: ['conv-1', 'conv-2'],
    type: [String],
    maxItems: 10,
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1, { message: 'Deve haver pelo menos uma conversa de destino' })
  @ArrayMaxSize(10, { message: 'Máximo de 10 conversas de destino' })
  targetConversationIds: string[];
}

export class ForwardBatchDto {
  @ApiProperty({
    description: 'IDs das mensagens a serem encaminhadas (máximo 50)',
    example: ['msg-1', 'msg-2', 'msg-3'],
    type: [String],
    maxItems: 50,
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1, { message: 'Deve haver pelo menos uma mensagem' })
  @ArrayMaxSize(50, { message: 'Máximo de 50 mensagens por vez' })
  messageIds: string[];

  @ApiProperty({
    description: 'IDs das conversas de destino (máximo 10)',
    example: ['conv-x', 'conv-y'],
    type: [String],
    maxItems: 10,
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1, { message: 'Deve haver pelo menos uma conversa de destino' })
  @ArrayMaxSize(10, { message: 'Máximo de 10 conversas de destino' })
  targetConversationIds: string[];
}
