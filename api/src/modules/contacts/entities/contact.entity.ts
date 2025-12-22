import { ApiProperty } from '@nestjs/swagger';

export class Contact {
  @ApiProperty({ example: 'fa49178f-6595-40b9-a569-3d5c07921234' })
  id: string;

  @ApiProperty({ example: 'Cliente Exemplo' })
  name: string;

  @ApiProperty({ example: '+5511998887766', required: false })
  phoneNumber?: string;

  @ApiProperty({ example: 'cliente@email.com', required: false })
  email?: string;

  @ApiProperty({ example: 'https://avatar.url/contact.png', required: false })
  profilePicUrl?: string;

  @ApiProperty({ example: { origem: 'site' }, required: false })
  customFields?: any;

  @ApiProperty({ example: 'fa4c178f-6595-40b9-a569-3d5c079288e5' })
  tenantId: string;

  @ApiProperty({ example: '2025-12-20T02:40:14.742Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-12-20T02:40:14.742Z' })
  updatedAt: Date;
}
