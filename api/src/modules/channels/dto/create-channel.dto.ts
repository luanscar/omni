import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ChannelType } from 'prisma/generated/enums';

export class CreateChannelDto {
  @ApiProperty({
    description: 'Nome amigável para identificar o canal',
    example: 'WhatsApp Vendas',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ enum: ChannelType, description: 'Tipo do canal' })
  @IsNotEmpty()
  @IsEnum(ChannelType)
  type: ChannelType;

  @ApiProperty({
    description:
      'Identificador externo (número do telefone, ID da página, etc)',
    required: false,
  })
  @IsOptional()
  @IsString()
  identifier?: string;

  @ApiProperty({
    description: 'Token de API externa (Meta Cloud API, etc)',
    required: false,
  })
  @IsOptional()
  @IsString()
  token?: string;
}
