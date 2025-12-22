import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTeamDto {
  @ApiProperty({ example: 'Suporte Técnico', description: 'Nome da equipe' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'Equipe responsável pelo Nível 1', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: ['uuid-do-usuario-1', 'uuid-do-usuario-2'],
    description: 'Lista de IDs dos usuários que farão parte desta equipe',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  memberIds?: string[];
}
