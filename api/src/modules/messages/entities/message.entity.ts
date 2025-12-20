import { ApiProperty } from '@nestjs/swagger';
import { MessageType, MessageSenderType } from 'prisma/generated/enums';

class MessageSenderUser {
    @ApiProperty({ example: 'fa4c178f-6595-40b9-a569-3d5c079288e5' })
    id: string;

    @ApiProperty({ example: 'João Silva' })
    name: string;

    @ApiProperty({ example: 'https://avatar.url/image.png', required: false })
    avatarUrl?: string;
}

class MessageSenderContact {
    @ApiProperty({ example: 'fa49178f-6595-40b9-a569-3d5c07921234' })
    id: string;

    @ApiProperty({ example: 'Luan Araújo' })
    name: string;

    @ApiProperty({ example: 'https://avatar.url/image.png', required: false })
    profilePicUrl?: string;
}

class MessageMedia {
    @ApiProperty({ example: 'fa49178f-6595-40b9-a569-3d5c07929999' })
    id: string;

    @ApiProperty({ example: 'image.png' })
    fileName: string;

    @ApiProperty({ example: 'image/png' })
    mimeType: string;

    @ApiProperty({ example: 'https://public.url/image.png' })
    publicUrl: string;
}

export class Message {
    @ApiProperty({ example: 'fa49178f-6595-40b9-a569-3d5c0792aaaa' })
    id: string;

    @ApiProperty({ example: 'wamid.HBgL...', required: false })
    providerId?: string;

    @ApiProperty({ enum: MessageType, example: MessageType.TEXT })
    type: MessageType;

    @ApiProperty({ example: 'Olá, como posso ajudar?', required: false })
    content?: string;

    @ApiProperty({ example: {}, required: false })
    metadata?: any;

    @ApiProperty({ example: 'fa49178f-6595-40b9-a569-3d5c07925555' })
    conversationId: string;

    @ApiProperty({ enum: MessageSenderType, example: MessageSenderType.USER })
    senderType: MessageSenderType;

    @ApiProperty({ example: 'fa4c178f-6595-40b9-a569-3d5c079288e5', required: false })
    senderUserId?: string;

    @ApiProperty({ type: MessageSenderUser, required: false })
    senderUser?: MessageSenderUser;

    @ApiProperty({ example: 'fa49178f-6595-40b9-a569-3d5c07921234', required: false })
    senderContactId?: string;

    @ApiProperty({ type: MessageSenderContact, required: false })
    senderContact?: MessageSenderContact;

    @ApiProperty({ example: 'fa49178f-6595-40b9-a569-3d5c07929999', required: false })
    mediaId?: string;

    @ApiProperty({ type: MessageMedia, required: false })
    media?: MessageMedia;

    @ApiProperty({ type: () => Message, required: false })
    quotedMessage?: Message;

    @ApiProperty({ example: false })
    read: boolean;

    @ApiProperty({ example: '2025-12-20T02:40:14.742Z' })
    createdAt: Date;
}
