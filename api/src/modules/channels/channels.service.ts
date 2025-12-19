import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class ChannelsService {
  constructor(private prisma: PrismaService) { }


  async create(createChannelDto: CreateChannelDto, tenantId: string) {
    return this.prisma.channel.create({
      data: {
        ...createChannelDto,
        tenantId,
      },
    });
  }

  findAll(tenantId: string) {
    return this.prisma.channel.findMany({
      where: { tenantId },
    });
  }

  async findOne(id: string, tenantId: string) {
    const channel = await this.prisma.channel.findFirst({
      where: { id, tenantId },
    });

    if (!channel) {
      throw new NotFoundException('Canal não encontrado ou acesso negado.');
    }

    return channel;
  }

  async update(id: string, updateChannelDto: UpdateChannelDto, tenantId: string) {
    // Verifica existência antes de atualizar
    await this.findOne(id, tenantId);

    return this.prisma.channel.update({
      where: { id },
      data: updateChannelDto,
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);

    return this.prisma.channel.delete({
      where: { id },
    });
  }
}
