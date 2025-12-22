import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'admin@omni.com',
    description: 'Email do usuário',
  })
  @IsEmail({}, { message: 'O email fornecido é inválido' })
  @IsNotEmpty({ message: 'O email não pode estar vazio' })
  email: string;

  @ApiProperty({
    example: 'admin123',
    description: 'Senha do usuário',
    minLength: 6,
  })
  @IsString({ message: 'A senha deve ser uma string' })
  @IsNotEmpty({ message: 'A senha não pode estar vazia' })
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres' })
  password: string;
}
