import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PlansController } from './plans.controller';
import { PlansService } from './plans.service';
import { PrismaService } from 'src/prisma.service';

@Module({
  imports: [ConfigModule],
  controllers: [PlansController],
  providers: [PlansService, PrismaService],
  exports: [PlansService],
})
export class PlansModule {}
