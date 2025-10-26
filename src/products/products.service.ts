import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client'; // ضع هذا في الأعلى إن لم يكن موجودًا

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) { }

  // 🟢 عرض كل المنتجات (للـ ADMIN أو CUSTOMER)
  async findAll() {
    return this.prisma.product.findMany({
      include: { vendor: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 🟢 عرض منتجات تاجر محدد
  async findByVendor(vendorId: string) {
    return this.prisma.product.findMany({
      where: { vendorId },
      include: { vendor: true },
    });
  }

  // 🟢 إنشاء منتج جديد (يدعم التاجر أو الأدمن)
async create(data: any, user: any) {
  if (user.role !== 'VENDOR' && user.role !== 'ADMIN') {
    throw new ForbiddenException('Only vendors or admin can add products');
  }

  // 🔍 تحديد vendorId
  let vendorId: string;
  if (user.role === 'ADMIN') {
    if (!data.vendorId) throw new ForbiddenException('vendorId is required for admin');
    vendorId = data.vendorId;
  } else {
    const vendor = await this.prisma.vendor.findUnique({
      where: { userId: user.id },
    });
    if (!vendor) throw new ForbiddenException('Vendor profile not found');
    vendorId = vendor.id;
  }

  // ✅ التحقق من الحقول المطلوبة
  if (!data.name || !data.sku || !data.price || !data.cost) {
    throw new ForbiddenException('Missing required fields (name, sku, price, cost)');
  }

  // 🧾 إنشاء المنتج
  const product = await this.prisma.product.create({
    data: {
      name: data.name,
      sku: data.sku,
      price: data.price,
      cost: data.cost,
      stock: data.stock ?? 0,
      active: data.active ?? true,
      categoryId: data.categoryId ?? null,
      vendorId: vendorId,
    },
    include: { category: { select: { name: true } }, vendor: { select: { companyName: true } } },
  });

  return {
    message: '✅ Product created successfully',
    product,
  };
}



  // 🟢 تعديل منتج (فقط مالكه أو ADMIN)
  async update(id: string, data: any, user: any) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new ForbiddenException('Product not found');

    if (user.role !== 'ADMIN' && product.vendorId !== user.vendorId) {
      throw new ForbiddenException('You can only edit your own products');
    }

    return this.prisma.product.update({
      where: { id },
      data,
    });
  }

  // 🟢 حذف منتج (ADMIN فقط)
  async remove(id: string, user: any) {
    if (user.role !== 'ADMIN') throw new ForbiddenException('Only admin can delete');
    return this.prisma.product.delete({ where: { id } });
  }

  async findByCurrentVendor(user: any) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { userId: user.id },
    });
    if (!vendor) throw new ForbiddenException('Vendor profile not found');

    return this.prisma.product.findMany({
      where: { vendorId: vendor.id },
      orderBy: { createdAt: 'desc' },
    });
  }

   // 🟢 searching
  

  async searchProducts(query: any) {
  const {
    search,
    categoryId,
    minPrice,
    maxPrice,
    sort = 'newest',
    page = 1,
    limit = 10,
  } = query;

  const filters: any = {
    active: true, // نعرض فقط المنتجات المفعّلة
  };

  // 🔍 بحث بالاسم أو الكلمة المفتاحية
  if (search) {
    filters.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
    ];
  }

  // 🏷️ فلترة حسب الفئة
  if (categoryId) {
    filters.categoryId = categoryId;
  }

  // 💰 فلترة حسب السعر
  if (minPrice || maxPrice) {
    filters.price = {};
    if (minPrice) filters.price.gte = parseFloat(minPrice);
    if (maxPrice) filters.price.lte = parseFloat(maxPrice);
  }

  // 🔄 الترتيب
   // ترتيب
    const orderBy: Prisma.ProductOrderByWithRelationInput =
  sort === 'price_asc'
    ? { price: 'asc' }
    : sort === 'price_desc'
      ? { price: 'desc' }
      : { createdAt: 'desc' };
      
  const skip = (page - 1) * limit;

  // 🧾 تنفيذ الاستعلام
  const [items, total] = await Promise.all([
    this.prisma.product.findMany({
      where: filters,
      include: {
        vendor: {
          select: { companyName: true },
        },
        category: {
          select: { name: true },
        },
      },
      orderBy,
      skip: parseInt(limit) * (page - 1),
      take: parseInt(limit),
    }),
    this.prisma.product.count({ where: filters }),
  ]);

  return {
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit),
    items,
  };
}



}
