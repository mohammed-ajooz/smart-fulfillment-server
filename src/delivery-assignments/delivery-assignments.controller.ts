import { Controller, Post, Get, Param, Body, Req, Patch, UseGuards } from '@nestjs/common';
import { DeliveryAssignmentsService } from './delivery-assignments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DeliveryAssignmentsController {
  constructor(private readonly assignmentsService: DeliveryAssignmentsService) {}

  // ✅ Dispatcher يعين سائقًا
  @Post('assign/:poId')
  @Roles('STAFF', 'ADMIN')
  assignDriver(@Param('poId') poId: string, @Body('driverId') driverId: string, @Req() req) {
    return this.assignmentsService.assignDriver(poId, driverId, req.user);
  }

  // ✅ عرض جميع المهام (Admin أو Dispatcher)
  @Get()
  @Roles('ADMIN', 'STAFF')
  findAll() {
    return this.assignmentsService.findAll();
  }

  // ✅ السائق يرى مهامه الخاصة
  @Get('my')
  @Roles('DRIVER')
  findMyAssignments(@Req() req) {
    return this.assignmentsService.findMyAssignments(req.user.id);
  }

  // ✅ السائق يكمل مهمة
  @Patch(':id/complete')
  @Roles('DRIVER')
  complete(@Param('id') id: string, @Req() req) {
    return this.assignmentsService.completeAssignment(id, req.user);
  }

  // ✅ عرض الطلبات الجاهزة للاستلام (Dispatcher فقط)
@Get('ready')
@Roles('ADMIN', 'STAFF')
findReadyForPickup() {
  return this.assignmentsService.findReadyForPickup();
}


// ✅ عرض جميع الطلبات الجاهزة لتعيين سائق (Dispatcher فقط)
@Get('po/ready')
@Roles('ADMIN', 'STAFF')
getAllPOsForAssign() {
  return this.assignmentsService.getAllPOsForAssign();
}

// ✅ عرض جميع السائقين (Dispatcher فقط)
@Get('drivers')
@Roles('ADMIN', 'STAFF')
getAllDrivers() {
  return this.assignmentsService.getAllDrivers();
}

// ✅ السائق يبدأ رحلة الاستلام
@Patch(':id/start')
@Roles('DRIVER')
startPickup(@Param('id') id: string, @Req() req) {
  return this.assignmentsService.startPickup(id, req.user);
}

// ✅ السائق يؤكد استلام الطلب من التاجر
@Patch(':id/pickedup')
@Roles('DRIVER')
confirmPickup(@Param('id') id: string, @Req() req) {
  return this.assignmentsService.confirmPickup(id, req.user);
}

}
