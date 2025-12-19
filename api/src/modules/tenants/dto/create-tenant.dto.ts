import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';
import { createSlug } from 'src/common/utils/create-slug.util';

export class CreateTenantDto {
  @ApiProperty({
    example: 'Minha Empresa',
    description: 'Nome da empresa (Tenant)',
  })
  @IsString({ message: 'O nome deve ser uma string' })
  @IsNotEmpty({ message: 'O nome não pode estar vazio' })
  name: string;

  @ApiProperty({
    example: 'minha-empresa',
    description: 'Slug identificador da empresa',
  })
  @Transform(({ value }) => createSlug(value))
  @IsString({ message: 'O slug deve ser uma string' })
  @IsNotEmpty({ message: 'O slug não pode estar vazio' })
  slug: string;
}
