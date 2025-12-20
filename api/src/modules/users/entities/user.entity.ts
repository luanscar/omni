import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from 'prisma/generated/enums';

export class User {
  @ApiProperty({ example: 'fa4c178f-6595-40b9-a569-3d5c079288e5' })
  id: string;

  @ApiProperty({ example: 'João Silva' })
  name: string;

  @ApiProperty({ example: 'joao@empresa.com' })
  email: string;

  @ApiProperty({ example: true })
  active: boolean;

  @ApiProperty({ example: 'https://avatar.url/image.png', required: false })
  avatarUrl?: string;

  @ApiProperty({ enum: UserRole, example: UserRole.AGENT })
  role: UserRole;

  @ApiProperty({ example: '2025-12-20T02:40:14.742Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-12-20T02:40:14.742Z' })
  updatedAt: Date;
}
