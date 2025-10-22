import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  await prisma.product.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();
  await prisma.category.deleteMany();

  console.log('🧹 Old data cleared.');

  // 🔹 إنشاء مستخدم ADMIN
  const adminPass = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@smart.com',
      passwordHash: adminPass,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  // 🔹 إنشاء مستخدم VENDOR
  const vendorPass = await bcrypt.hash('vendor123', 10);
  const vendorUser = await prisma.user.create({
    data: {
      name: 'BlueBird Vendor',
      email: 'vendor@smart.com',
      passwordHash: vendorPass,
      role: 'VENDOR',
      status: 'ACTIVE',
    },
  });

  // 🔹 إنشاء سجل Vendor مرتبط
  const vendorProfile = await prisma.vendor.create({
    data: {
      userId: vendorUser.id,
      companyName: 'BlueBird Logistics',
      phone: '07701234567',
      address: 'Erbil Warehouse',
      status: 'ACTIVE',
    },
  });

  // 🔹 إنشاء مستخدم CUSTOMER
  const customerPass = await bcrypt.hash('customer123', 10);
  const customerUser = await prisma.user.create({
    data: {
      name: 'Test Customer',
      email: 'customer@smart.com',
      passwordHash: customerPass,
      role: 'CUSTOMER',
      status: 'ACTIVE',
    },
  });

  await prisma.customer.create({
    data: {
      userId: customerUser.id,
      phone: '07501122334',
      city: 'Erbil',
      address: 'Downtown',
    },
  });

  // 🔹 إنشاء الفئات الأساسية
  const categories = await prisma.category.createMany({
    data: [
      { name: 'Electronics' },
      { name: 'Fashion' },
      { name: 'Home' },
      { name: 'Food' },
      { name: 'Beauty' },
    ],
  });

  console.log('📦 Categories added.');

  // جلب ID للفئة Electronics
  const electronics = await prisma.category.findFirst({ where: { name: 'Electronics' } });

  // 🔹 إضافة بعض المنتجات للتاجر وربطها بفئة
  await prisma.product.createMany({
    data: [
      {
        name: 'Wireless Mouse',
        sku: 'WM-2025',
        price: 25.5,
        cost: 15,
        vendorId: vendorProfile.id,
        categoryId: electronics?.id,
      },
      {
        name: 'Bluetooth Keyboard',
        sku: 'BK-2025',
        price: 30.0,
        cost: 20.0,
        vendorId: vendorProfile.id,
        categoryId: electronics?.id,
      },
    ],
  });

  console.log('✅ Seed completed successfully.');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
