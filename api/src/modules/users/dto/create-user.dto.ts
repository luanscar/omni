import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'Nome do usuário',
  })
  @IsString({ message: 'O nome deve ser uma string' })
  @IsNotEmpty({ message: 'O nome não pode estar vazio' })
  name: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email do usuário',
  })
  @IsEmail({}, { message: 'O email deve ser um endereço de email válido' })
  @IsNotEmpty({ message: 'O email não pode estar vazio' })
  email: string;

  @ApiProperty({
    example: '123456',
    description: 'Senha do usuário',
    minLength: 6,
  })
  @IsString({ message: 'A senha deve ser uma string' })
  @IsNotEmpty({ message: 'A senha não pode estar vazia' })
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres' })
  password: string;

  @ApiProperty({
    example: 'uuid-do-tenant',
    description: 'ID do Tenant (Empresa) ao qual o usuário pertence',
  })
  @IsString({ message: 'O ID do tenant deve ser uma string' })
  @IsNotEmpty({ message: 'O ID do tenant não pode estar vazio' })
  @IsUUID(undefined, { message: 'O ID do tenant deve ser um UUID válido' })
  tenantId: string;
}
