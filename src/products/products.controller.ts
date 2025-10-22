import { Controller, Get, Post, Put, Delete, Param, Body, Req, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }


  // ✅ عرض منتجات التاجر الحالي (من التوكن)
  @Get('my-products')
  @Roles('VENDOR')
  getMyProducts(@Req() req) {
    return this.productsService.findByCurrentVendor(req.user);
  }


  // ✅ عرض جميع المنتجات (ADMIN أو CUSTOMER)
  @Get()
  @Roles('ADMIN', 'CUSTOMER', 'VENDOR')
  getAll() {
    return this.productsService.findAll();
  }

  // ✅ عرض منتجات تاجر محدد
  @Get('vendor/:vendorId')
  @Roles('ADMIN', 'VENDOR')
  getByVendor(@Param('vendorId') vendorId: string) {
    return this.productsService.findByVendor(vendorId);
  }

  // ✅ إضافة منتج جديد (VENDOR فقط)
  @Post()
  @Roles('VENDOR', 'ADMIN')
  create(@Body() body, @Req() req) {
    return this.productsService.create(body, req.user);
  }

  // ✅ تعديل منتج (صاحب المنتج فقط)
  @Put(':id')
  @Roles('VENDOR', 'ADMIN')
  update(@Param('id') id: string, @Body() body, @Req() req) {
    return this.productsService.update(id, body, req.user);
  }

  // ✅ حذف منتج (ADMIN فقط)
  @Delete(':id')
  @Roles('ADMIN')
  delete(@Param('id') id: string, @Req() req) {
    return this.productsService.remove(id, req.user);
  }

  // 🟢 عرض المنتجات للـ Customer مع الفلاتر
@Get('browse')
@Roles('CUSTOMER', 'ADMIN', 'VENDOR')
browse(@Req() req) {
  return this.productsService.searchProducts(req.query);
}

}
