import { Module } from '@nestjs/common';
import { DeliveryAssignmentsService } from './delivery-assignments.service';
import { DeliveryAssignmentsController } from './delivery-assignments.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [DeliveryAssignmentsController],
  providers: [DeliveryAssignmentsService, PrismaService],
})
export class DeliveryAssignmentsModule {}
