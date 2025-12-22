import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUrl } from 'class-validator';

export class CreateCheckoutSessionDto {
    @ApiProperty({
        example: 'fa4c178f-6595-40b9-a569-3d5c079288e5',
        description: 'ID do plano de assinatura',
    })
    @IsString({ message: 'O ID do plano deve ser uma string' })
    @IsNotEmpty({ message: 'O ID do plano não pode estar vazio' })
    planId: string;

    @ApiProperty({
        example: 'https://app.exemplo.com/success',
        description: 'URL de redirecionamento após pagamento bem-sucedido (OPCIONAL - padrão: APP_URL/subscription/success)',
        required: false,
    })
    @IsOptional()
    @IsUrl({}, { message: 'A URL de sucesso deve ser válida' })
    successUrl?: string;

    @ApiProperty({
        example: 'https://app.exemplo.com/cancel',
        description: 'URL de redirecionamento se o usuário cancelar o pagamento (OPCIONAL - padrão: APP_URL/subscription/cancel)',
        required: false,
    })
    @IsOptional()
    @IsUrl({}, { message: 'A URL de cancelamento deve ser válida' })
    cancelUrl?: string;
}

