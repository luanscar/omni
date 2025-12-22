import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { PrismaService } from 'src/prisma.service';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [WhatsappModule, AuditModule],
  controllers: [MessagesController],
  providers: [MessagesService, PrismaService],
})
export class MessagesModule {}
