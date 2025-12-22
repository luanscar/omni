import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTeamDto {
  @ApiProperty({
    example: 'Suporte Técnico',
    description: 'Nome da equipe',
  })
  @IsString({ message: 'O nome deve ser uma string' })
  @IsNotEmpty({ message: 'O nome não pode estar vazio' })
  name: string;

  @ApiProperty({
    example: 'Equipe responsável pelo Nível 1',
    description: 'Descrição da equipe',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'A descrição deve ser uma string' })
  description?: string;

  @ApiProperty({
    example: ['uuid-do-usuario-1', 'uuid-do-usuario-2'],
    description: 'Lista de IDs dos usuários que farão parte desta equipe',
    required: false,
  })
  @IsOptional()
  @IsArray({ message: 'Os IDs dos membros devem estar em um array' })
  @IsUUID('4', {
    each: true,
    message: 'Cada ID de membro deve ser um UUID válido',
  })
  memberIds?: string[];
}
