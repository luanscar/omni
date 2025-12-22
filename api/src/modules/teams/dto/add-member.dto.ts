import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TeamRole } from 'prisma/generated/enums';

export class AddMemberDto {
  @ApiProperty({
    example: 'uuid-do-usuario',
    description: 'ID do usuário a ser adicionado ao time',
  })
  @IsUUID(undefined, { message: 'O ID do usuário deve ser um UUID válido' })
  @IsNotEmpty({ message: 'O ID do usuário não pode estar vazio' })
  userId: string;

  @ApiProperty({
    enum: TeamRole,
    example: TeamRole.MEMBER,
    description: 'Papel do usuário no time',
    default: TeamRole.MEMBER,
  })
  @IsEnum(TeamRole, { message: 'O papel deve ser um valor válido de TeamRole' })
  role: TeamRole = TeamRole.MEMBER;
}
