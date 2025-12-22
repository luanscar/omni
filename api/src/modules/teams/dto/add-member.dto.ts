import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TeamRole } from 'prisma/generated/enums';

export class AddMemberDto {
  @ApiProperty({
    example: 'uuid-do-usuario',
    description: 'ID do usuário a ser adicionado',
  })
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @ApiProperty({
    enum: TeamRole,
    description: 'Papel do usuário no time',
    default: TeamRole.MEMBER,
  })
  @IsEnum(TeamRole)
  role: TeamRole = TeamRole.MEMBER;
}
