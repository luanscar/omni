import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { UsersModule } from './modules/users/users.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { AuthModule } from './modules/auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './modules/auth/jwt-auth.guard';
import { RolesGuard } from './modules/auth/roles.guard';
import { ChannelsModule } from './modules/channels/channels.module';
import { WhatsappModule } from './modules/whatsapp/whatsapp.module';
import { TeamsModule } from './modules/teams/teams.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { StorageModule } from './modules/storage/storage.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { MessagesModule } from './modules/messages/messages.module';

@Module({
  imports: [UsersModule, TenantsModule, AuthModule, ChannelsModule, WhatsappModule, TeamsModule, ContactsModule, StorageModule, ConversationsModule, MessagesModule],
  controllers: [],
  providers: [
    PrismaService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule { }
