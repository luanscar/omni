import { ApiProperty } from '@nestjs/swagger';
import { ChannelType } from 'prisma/generated/enums';

export class Channel {
    @ApiProperty({ example: 'fa49178f-6595-40b9-a569-3d5c079288e5' })
    id: string;

    @ApiProperty({ example: 'Suporte Whatsapp' })
    name: string;

    @ApiProperty({ enum: ChannelType, example: ChannelType.WHATSAPP })
    type: ChannelType;

    @ApiProperty({ example: '5511999999999', required: false })
    identifier?: string;

    @ApiProperty({ example: true })
    active: boolean;

    @ApiProperty({ example: 'fa4c178f-6595-40b9-a569-3d5c079288e5' })
    tenantId: string;

    @ApiProperty({ example: '2025-12-20T02:40:14.742Z' })
    createdAt: Date;

    @ApiProperty({ example: '2025-12-20T02:40:14.742Z' })
    updatedAt: Date;
}
