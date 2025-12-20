import { ApiProperty } from '@nestjs/swagger';
import { ConversationStatus } from 'prisma/generated/enums';

class ConversationContact {
    @ApiProperty({ example: 'Luan Araújo' })
    name: string;

    @ApiProperty({ example: '/storage/abc-123/download', required: false })
    profilePicUrl?: string;
}

class ConversationAssignee {
    @ApiProperty({ example: 'João Silva' })
    name: string;

    @ApiProperty({ example: 'https://avatar.url/image.png', required: false })
    avatarUrl?: string;
}

class ConversationTeam {
    @ApiProperty({ example: 'Vendas' })
    name: string;
}

class ConversationCount {
    @ApiProperty({ example: 5 })
    messages: number;
}

export class Conversation {
    @ApiProperty({ example: 'fa49178f-6595-40b9-a569-3d5c07925555' })
    id: string;

    @ApiProperty({ example: 1 })
    sequenceId: number;

    @ApiProperty({ example: 'fa4c178f-6595-40b9-a569-3d5c079288e5' })
    tenantId: string;

    @ApiProperty({ example: 'fa49178f-6595-40b9-a569-3d5c07921234', required: false })
    contactId?: string;

    @ApiProperty({ example: 'fa49178f-6595-40b9-a569-3d5c079288e5', required: false })
    channelId?: string;

    @ApiProperty({ example: 'fa49178f-6595-40b9-a569-3d5c07927777', required: false })
    teamId?: string;

    @ApiProperty({ example: 'fa4c178f-6595-40b9-a569-3d5c079288e5', required: false })
    assigneeId?: string;

    @ApiProperty({ enum: ConversationStatus, example: ConversationStatus.OPEN })
    status: ConversationStatus;

    @ApiProperty({ type: ConversationContact, required: false })
    contact?: ConversationContact;

    @ApiProperty({ type: ConversationAssignee, required: false })
    assignee?: ConversationAssignee;

    @ApiProperty({ type: ConversationTeam, required: false })
    team?: ConversationTeam;

    @ApiProperty({ type: ConversationCount })
    _count: ConversationCount;

    @ApiProperty({ example: '2025-12-20T02:40:14.742Z' })
    createdAt: Date;

    @ApiProperty({ example: '2025-12-20T02:40:14.742Z' })
    updatedAt: Date;
}
