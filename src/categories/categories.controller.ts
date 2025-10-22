import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';

@Controller('categories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  // عرض الفئات
  @Get()
  @Roles('ADMIN', 'CUSTOMER', 'VENDOR')
  getAll() {
    return this.categoriesService.findAll();
  }

  // إضافة فئة جديدة
  @Post()
  @Roles('ADMIN')
  create(@Body() body) {
    return this.categoriesService.create(body);
  }

  // عرض المنتجات داخل فئة
  @Get(':id/products')
  @Roles('CUSTOMER', 'ADMIN')
  getProducts(@Param('id') id: string) {
    return this.categoriesService.findProductsByCategory(id);
  }
}
