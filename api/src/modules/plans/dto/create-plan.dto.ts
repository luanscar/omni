import { ApiProperty } from '@nestjs/swagger';
import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsEnum,
    IsInt,
    Min,
} from 'class-validator';
import { PlanType } from 'prisma/generated/enums';

export class CreatePlanDto {
    @ApiProperty({
        example: 'Plano Básico',
        description: 'Nome do plano',
    })
    @IsString({ message: 'O nome deve ser uma string' })
    @IsNotEmpty({ message: 'O nome não pode estar vazio' })
    name: string;

    @ApiProperty({
        enum: PlanType,
        example: PlanType.BASIC,
        description: 'Tipo do plano',
    })
    @IsEnum(PlanType, { message: 'O tipo deve ser um valor válido de PlanType' })
    type: PlanType;

    @ApiProperty({
        example: 'Ideal para pequenas equipes',
        description: 'Descrição do plano',
        required: false,
    })
    @IsOptional()
    @IsString({ message: 'A descrição deve ser uma string' })
    description?: string;

    @ApiProperty({
        example: 2,
        description: 'Número máximo de usuários',
    })
    @IsInt({ message: 'O número máximo de usuários deve ser um inteiro' })
    @Min(1, { message: 'O número máximo de usuários deve ser no mínimo 1' })
    maxUsers: number;

    @ApiProperty({
        example: 1,
        description: 'Número máximo de canais',
    })
    @IsInt({ message: 'O número máximo de canais deve ser um inteiro' })
    @Min(1, { message: 'O número máximo de canais deve ser no mínimo 1' })
    maxChannels: number;

    @ApiProperty({
        example: 500,
        description: 'Número máximo de conversas por mês',
    })
    @IsInt({ message: 'O número máximo de conversas deve ser um inteiro' })
    @Min(1, { message: 'O número máximo de conversas deve ser no mínimo 1' })
    maxConversations: number;

    @ApiProperty({
        example: 'price_1234567890',
        description: 'ID do preço no Stripe (opcional, será criado automaticamente se não fornecido)',
        required: false,
    })
    @IsOptional()
    @IsString({ message: 'O ID do preço deve ser uma string' })
    stripePriceId?: string;

    @ApiProperty({
        example: 'prod_1234567890',
        description: 'ID do produto no Stripe (opcional, será criado automaticamente se não fornecido)',
        required: false,
    })
    @IsOptional()
    @IsString({ message: 'O ID do produto deve ser uma string' })
    stripeProductId?: string;

    @ApiProperty({
        example: 4990,
        description: 'Preço mensal em centavos (ex: 4990 = R$ 49,90)',
    })
    @IsInt({ message: 'O preço deve ser um inteiro' })
    @Min(0, { message: 'O preço deve ser no mínimo 0' })
    priceMonthly: number;
}
