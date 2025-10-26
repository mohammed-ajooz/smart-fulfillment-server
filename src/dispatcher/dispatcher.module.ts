import { Module } from '@nestjs/common';
import { DispatcherService } from './dispatcher.service';
import { DispatcherController } from './dispatcher.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [DispatcherController],
  providers: [DispatcherService, PrismaService],
})
export class DispatcherModule {}
