import { Module } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { WhatsappController } from './whatsapp.controller';
import { BullModule } from '@nestjs/bull'; // <--- Importar
import { PrismaService } from '../../prisma.service';
import { WhatsappProcessor } from './whatsapp.processor';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'whatsapp-events',
    }),
    StorageModule
  ],
  controllers: [WhatsappController],
  providers: [WhatsappService, WhatsappProcessor, PrismaService,],
  exports: [WhatsappService, BullModule],
})
export class WhatsappModule { }