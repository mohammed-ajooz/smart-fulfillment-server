import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Patch, Param, Query } from '@nestjs/common';


@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) { }

  // ✅ إنشاء طلب جديد (عميل)
  @Post()
  @Roles('CUSTOMER')
  create(@Req() req, @Body() body) {
    return this.ordersService.createOrder(req.user, body);
  }

  // ✅ عرض الطلبات (Admin / Vendor / Customer)
  @Get()
  @Roles('ADMIN', 'CUSTOMER', 'VENDOR')
  getAll(@Req() req) {
    return this.ordersService.findAll(req.user);
  }


  // ✅ عرض الطلبات المعلقة للموافقة
  @Get('pending')
  @Roles('ADMIN', 'STAFF')
  getPending() {
    return this.ordersService.findPendingOrders();
  }

  // ✅ تأكيد الطلب (Customer Service)
  @Patch(':id/confirm')
  @Roles('ADMIN', 'STAFF')
  confirm(@Param('id') id: string) {
    return this.ordersService.confirmOrder(id);
  }

  // ❌ رفض الطلب
  @Patch(':id/reject')
  @Roles('ADMIN', 'STAFF')
  reject(@Param('id') id: string, @Query('reason') reason?: string) {
    return this.ordersService.rejectOrder(id, reason);
  }

  // po
  // ✅ عرض طلبات التاجر
  @Get('vendor/my-pos')
  @Roles('VENDOR')
  getVendorPOs(@Req() req) {
    return this.ordersService.findVendorPOs(req.user);
  }

  // ✅ تأكيد الـ PO
  @Patch('vendor/confirm/:id')
  @Roles('VENDOR')
  confirmPO(@Param('id') id: string, @Req() req) {
    return this.ordersService.confirmPO(id, req.user);
  }

  // ❌ رفض الـ PO
  @Patch('vendor/reject/:id')
  @Roles('VENDOR')
  rejectPO(@Param('id') id: string, @Req() req, @Query('reason') reason: string) {
    return this.ordersService.rejectPO(id, reason, req.user);
  }


  // ✅   عرض طلبات التاجر المستلمة
  @Get('vendor/my-ac-pos')
  @Roles('VENDOR')
  getVendorACPOs(@Req() req) {
    return this.ordersService.findVendorPOs(req.user);
  }


  // ✅ التاجر يجهز الطلب
  @Patch('vendor/ready/:id')
  @Roles('VENDOR')
  readyForPickup(@Param('id') id: string, @Req() req) {
    return this.ordersService.markReadyForPickup(id, req.user);
  }

  // ✅ السائق يستلم الطلب
  @Patch('driver/transit/:id')
  @Roles('DRIVER', 'DISPATCHER', 'ADMIN')
  markInTransit(@Param('id') id: string, @Req() req) {
    return this.ordersService.markInTransit(id, req.user);
  }

  // ✅ المستودع يستلم الطلب
  @Patch('warehouse/receive/:id')
  @Roles('WAREHOUSE', 'ADMIN')
  markReceived(@Param('id') id: string, @Req() req) {
    return this.ordersService.markReceivedAtWarehouse(id, req.user);
  }
}
