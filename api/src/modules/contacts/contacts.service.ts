import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@Injectable()
export class ContactsService {
  constructor(private prisma: PrismaService) { }

  async create(createContactDto: CreateContactDto, tenantId: string) {
    if (createContactDto.phoneNumber) {
      const existingContact = await this.prisma.contact.findFirst({
        where: {
          tenantId,
          phoneNumber: createContactDto.phoneNumber,
        },
      });

      if (existingContact) {
        throw new ConflictException(
          `Já existe um contato com o número ${createContactDto.phoneNumber} nesta organização.`,
        );
      }
    }

    return this.prisma.contact.create({
      data: {
        ...createContactDto,
        tenantId,
      },
    });
  }

  findAll(tenantId: string) {
    return this.prisma.contact.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id, tenantId },
    });

    if (!contact) {
      throw new NotFoundException('Contato não encontrado.');
    }

    return contact;
  }

  async update(id: string, updateContactDto: UpdateContactDto, tenantId: string) {
    await this.findOne(id, tenantId); // Garante existência e permissão

    return this.prisma.contact.update({
      where: { id },
      data: updateContactDto,
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId); // Garante existência e permissão

    return this.prisma.contact.delete({
      where: { id },
    });
  }
}