import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID, ValidateIf, ValidateNested } from 'class-validator';
import { ApiProperty, OmitType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CreateMessageDto } from './create-message.dto';
import { MessageType } from 'prisma/generated/enums';

// DTO para cada mensagem dentro do batch (sem conversationId)
export class BatchMessageItemDto extends OmitType(CreateMessageDto, ['conversationId'] as const) { }

export class BatchMessageDto {
    @ApiProperty({
        example: 'fa49178f-6595-40b9-a569-3d5c07925555',
        description: 'ID da conversa onde todas as mensagens serão enviadas'
    })
    @IsNotEmpty()
    @IsUUID()
    conversationId: string;

    @ApiProperty({
        type: [BatchMessageItemDto],
        description: 'Array de mensagens a serem enviadas',
        example: [
            {
                type: 'IMAGE',
                mediaId: '33d19c8f-76e9-44b9-b27e-d7b4899518a9',
                content: 'Foto 1'
            },
            {
                type: 'IMAGE',
                mediaId: '1ec3ca1c-c4a0-41e1-88a3-b3aa077e1f00',
                content: 'Foto 2'
            }
        ]
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => BatchMessageItemDto)
    messages: BatchMessageItemDto[];
}
