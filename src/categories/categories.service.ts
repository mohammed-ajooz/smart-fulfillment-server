import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  // عرض كل الفئات (مع الفئات الفرعية)
  async findAll() {
    return this.prisma.category.findMany({
      where: { parentId: null },
      include: {
        children: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  // إضافة فئة جديدة
  async create(data: any) {
    return this.prisma.category.create({ data });
  }

  // عرض المنتجات داخل فئة محددة
  async findProductsByCategory(id: string) {
    return this.prisma.product.findMany({
      where: { categoryId: id },
      include: { vendor: true },
    });
  }
}
