import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Patch, Param, Query } from '@nestjs/common';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

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
}
