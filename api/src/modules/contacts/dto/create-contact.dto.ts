import { IsEmail, IsNotEmpty, IsOptional, IsString, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateContactDto {
    @ApiProperty({
        example: 'João da Silva',
        description: 'Nome completo do contato'
    })
    @IsString({ message: 'O nome deve ser uma string' })
    @IsNotEmpty({ message: 'O nome não pode estar vazio' })
    name: string;

    @ApiProperty({
        example: '5511999999999',
        description: 'Número de telefone no formato E.164 (DDI + DDD + Número)',
        required: false
    })
    @IsOptional()
    @IsString({ message: 'O telefone deve ser uma string' })
    phoneNumber?: string;

    @ApiProperty({
        example: 'joao@email.com',
        description: 'Endereço de email do contato',
        required: false
    })
    @IsOptional()
    @IsEmail({}, { message: 'O email deve ser um endereço de email válido' })
    email?: string;

    @ApiProperty({
        example: 'https://exemplo.com/foto.jpg',
        description: 'URL da foto de perfil do contato',
        required: false
    })
    @IsOptional()
    @IsString({ message: 'A URL da foto deve ser uma string' })
    profilePicUrl?: string;

    @ApiProperty({
        example: { cpf: '123.456.789-00', vip: true, tags: ['novo', 'lead'] },
        description: 'Objeto JSON livre para armazenar campos personalizados do contato',
        required: false
    })
    @IsOptional()
    @IsObject({ message: 'Os campos personalizados devem ser um objeto válido' })
    customFields?: Record<string, any>;
}