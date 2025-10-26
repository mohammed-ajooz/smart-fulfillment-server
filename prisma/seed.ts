import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Clearing old data...');

  // حذف البيانات بالترتيب الصحيح لتفادي العلاقات
  await prisma.inboundLine.deleteMany();
  await prisma.inboundReceipt.deleteMany();
  await prisma.movement.deleteMany();
  await prisma.stock.deleteMany();
  await prisma.purchaseOrderItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.salesOrderItem.deleteMany();
  await prisma.salesOrder.deleteMany();
  await prisma.product.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();
  await prisma.category.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.location.deleteMany();

  console.log('✅ Database cleared.');

  // ---------------------------------------------------
  // 🧑‍💼 إنشاء المستخدمين الأساسيين
  // ---------------------------------------------------

  const adminPass = await bcrypt.hash('admin123', 10);
  const vendorPass = await bcrypt.hash('vendor123', 10);
  const customerPass = await bcrypt.hash('customer123', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@smart.com',
      passwordHash: adminPass,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  const vendorUser = await prisma.user.create({
    data: {
      name: 'BlueBird Vendor',
      email: 'vendor@smart.com',
      passwordHash: vendorPass,
      role: 'VENDOR',
      status: 'ACTIVE',
    },
  });

  const customerUser = await prisma.user.create({
    data: {
      name: 'John Customer',
      email: 'customer@smart.com',
      passwordHash: customerPass,
      role: 'CUSTOMER',
      status: 'ACTIVE',
    },
  });

  // ---------------------------------------------------
  // 🏢 إنشاء Vendor و Customer مرتبطين بالمستخدمين
  // ---------------------------------------------------

  const vendor = await prisma.vendor.create({
    data: {
      userId: vendorUser.id,
      companyName: 'BlueBird Logistics',
      phone: '07701234567',
      address: 'Erbil Warehouse',
      status: 'ACTIVE',
    },
  });

  const customer = await prisma.customer.create({
    data: {
      userId: customerUser.id,
      phone: '07501122334',
      city: 'Erbil',
      address: 'Downtown Street 24',
    },
  });

  // ---------------------------------------------------
  // 🏬 إنشاء مستودع + مواقع بسيطة (Zone / Aisle / Shelf / Rank / Bin)
  // ---------------------------------------------------

  const warehouse = await prisma.warehouse.create({
    data: {
      name: 'Main Warehouse Erbil',
      code: 'ERB-MAIN',
      city: 'Erbil',
      address: 'Industrial Zone A',
    },
  });

  const zone = await prisma.location.create({
    data: {
      warehouseId: warehouse.id,
      type: 'ZONE',
      code: 'Z-A',
    },
  });

  const aisle = await prisma.location.create({
    data: {
      warehouseId: warehouse.id,
      parentId: zone.id,
      type: 'AISLE',
      code: 'A1',
    },
  });

  const shelf = await prisma.location.create({
    data: {
      warehouseId: warehouse.id,
      parentId: aisle.id,
      type: 'SHELF',
      code: 'S1',
    },
  });

  const rank = await prisma.location.create({
    data: {
      warehouseId: warehouse.id,
      parentId: shelf.id,
      type: 'RANK',
      code: 'R1',
    },
  });

  const bin = await prisma.location.create({
    data: {
      warehouseId: warehouse.id,
      parentId: rank.id,
      type: 'BIN',
      code: 'B1',
    },
  });

  // ---------------------------------------------------
  // 🧭 إنشاء فئات (Categories)
  // ---------------------------------------------------

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

  // ---------------------------------------------------
  // 🛒 إنشاء منتجات تابعة للتاجر
  // ---------------------------------------------------

  const electronics = await prisma.category.findFirst({ where: { name: 'Electronics' } });

  await prisma.product.createMany({
    data: [
      {
        name: 'Wireless Mouse',
        sku: 'WM-2025',
        price: 25.5,
        cost: 15,
        vendorId: vendor.id,
        stock: 100,
        active: true,
      },
      {
        name: 'Bluetooth Keyboard',
        sku: 'BK-2025',
        price: 30,
        cost: 20,
        vendorId: vendor.id,
        stock: 80,
        active: true,
      },
      {
        name: 'Smart Watch',
        sku: 'SW-2025',
        price: 70,
        cost: 50,
        vendorId: vendor.id,
        stock: 40,
        active: true,
      },
    ],
  });

  console.log('✅ Products created.');

  // ---------------------------------------------------
  // 🧾 تأكيد نجاح العملية
  // ---------------------------------------------------

  console.log('🎉 Seed completed successfully!');
  console.log('👤 Admin Login:    admin@smart.com / admin123');
  console.log('🏪 Vendor Login:   vendor@smart.com / vendor123');
  console.log('🧍 Customer Login: customer@smart.com / customer123');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
