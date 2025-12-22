import { ApiProperty } from '@nestjs/swagger';
import { TeamRole } from 'prisma/generated/enums';

class TeamUser {
  @ApiProperty({ example: 'fa4c178f-6595-40b9-a569-3d5c079288e5' })
  id: string;

  @ApiProperty({ example: 'João Silva' })
  name: string;

  @ApiProperty({ example: 'https://avatar.url/image.png', required: false })
  avatarUrl?: string;
}

class TeamMember {
  @ApiProperty({ example: 'fa49178f-6595-40b9-a569-3d5c07920000' })
  id: string;

  @ApiProperty({ enum: TeamRole, example: TeamRole.MEMBER })
  role: TeamRole;

  @ApiProperty({ type: TeamUser })
  user: TeamUser;
}

class TeamCount {
  @ApiProperty({ example: 3 })
  members: number;
}

export class Team {
  @ApiProperty({ example: 'fa49178f-6595-40b9-a569-3d5c07927777' })
  id: string;

  @ApiProperty({ example: 'Vendas' })
  name: string;

  @ApiProperty({ example: 'Equipe comercial', required: false })
  description?: string;

  @ApiProperty({ example: 'fa4c178f-6595-40b9-a569-3d5c079288e5' })
  tenantId: string;

  @ApiProperty({ type: [TeamMember], required: false })
  members?: TeamMember[];

  @ApiProperty({ type: TeamCount, required: false })
  _count?: TeamCount;

  @ApiProperty({ example: '2025-12-20T02:40:14.742Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-12-20T02:40:14.742Z' })
  updatedAt: Date;
}
