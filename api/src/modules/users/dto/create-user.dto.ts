import { IsEmail, IsNotEmpty, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateUserDto {
    @IsString({ message: 'O nome deve ser uma string' })
    @IsNotEmpty({ message: 'O nome não pode estar vazio' })
    name: string;

    @IsEmail({}, { message: 'O email deve ser um endereço de email válido' })
    @IsNotEmpty({ message: 'O email não pode estar vazio' })
    email: string;

    @IsString({ message: 'A senha deve ser uma string' })
    @IsNotEmpty({ message: 'A senha não pode estar vazia' })
    @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres' })
    password: string;

    @IsString({ message: 'O ID do tenant deve ser uma string' })
    @IsNotEmpty({ message: 'O ID do tenant não pode estar vazio' })
    @IsUUID(undefined, { message: 'O ID do tenant deve ser um UUID válido' })
    tenantId: string;
}
