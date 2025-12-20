import { ApiProperty } from '@nestjs/swagger';

export class Tenant {
    @ApiProperty({ example: 'fa4c178f-6595-40b9-a569-3d5c079288e5' })
    id: string;

    @ApiProperty({ example: 'Minha Empresa' })
    name: string;

    @ApiProperty({ example: 'minha-empresa' })
    slug: string;

    @ApiProperty({ example: true })
    active: boolean;

    @ApiProperty({ example: '2025-12-20T02:40:14.742Z' })
    createdAt: Date;

    @ApiProperty({ example: '2025-12-20T02:40:14.742Z' })
    updatedAt: Date;
}
