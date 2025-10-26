import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SalesOrderStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) { }

  // ✅ إنشاء طلب جديد من العميل
  async createOrder(user: any, data: any) {
    if (user.role !== 'CUSTOMER') {
      throw new ForbiddenException('Only customers can create orders');
    }

    const customer = await this.prisma.customer.findUnique({
      where: { userId: user.id },
    });

    if (!customer) {
      throw new ForbiddenException('Customer profile not found');
    }

    const items = data.items;
    if (!items || items.length === 0) {
      throw new ForbiddenException('No items found');
    }

    // حساب المجموع
    const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);

    // إنشاء SalesOrder
    const order = await this.prisma.salesOrder.create({
      data: {
        orderCode: `SO-${Date.now()}`,
        customerId: customer.id,
        total,
        status: 'PENDING_CONFIRMATION',
        items: {
          create: items.map((i) => ({
            productId: i.productId,
            qty: i.qty,
            price: i.price,
            subtotal: i.price * i.qty,
          })),
        },
      },
      include: { items: true },
    });

    // إنشاء Purchase Orders حسب التاجر
    const groupedByVendor: Record<string, any[]> = {};
    for (const item of order.items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
      });
      if (product) {
        if (!groupedByVendor[product.vendorId]) {
          groupedByVendor[product.vendorId] = [];
        }
        groupedByVendor[product.vendorId].push(item);
      }
    }

    for (const vendorId of Object.keys(groupedByVendor)) {
      const vendorItems = groupedByVendor[vendorId];
      const total = vendorItems.reduce((sum, i) => sum + i.subtotal, 0);

      await this.prisma.purchaseOrder.create({
        data: {
          soId: order.id,
          vendorId,
          total,
          status: 'PENDING_VENDOR_CONFIRM',
          items: {
            create: vendorItems.map((i) => ({
              productId: i.productId,
              qty: i.qty,
              price: i.price,
              subtotal: i.subtotal,
            })),
          },
        },
      });
    }

    return order;
  }

  // ✅ عرض كل الطلبات (حسب الدور)
  async findAll(user: any) {
    if (user.role === 'ADMIN') {
      return this.prisma.salesOrder.findMany({
        include: { customer: true, items: true },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (user.role === 'CUSTOMER') {
      const customer = await this.prisma.customer.findUnique({
        where: { userId: user.id },
      });

      if (!customer) throw new ForbiddenException('Customer profile not found');

      return this.prisma.salesOrder.findMany({
        where: { customerId: customer.id },
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      });
    }




    if (user.role === 'VENDOR') {
      const vendor = await this.prisma.vendor.findUnique({
        where: { userId: user.id },
      });

      if (!vendor) throw new ForbiddenException('Vendor profile not found');

      return this.prisma.purchaseOrder.findMany({
        where: { vendorId: vendor.id },
        include: { items: true, salesOrder: true },
        orderBy: { createdAt: 'desc' },
      });
    }


    throw new ForbiddenException('Role not allowed');
  }

  // ✅ طلبات بانتظار تأكيد Customer Service
  async findPendingOrders() {
    return this.prisma.salesOrder.findMany({
      where: { status: 'PENDING_CONFIRMATION' },
      include: { customer: true, items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ✅ تأكيد الطلب من قبل Customer Service
  async confirmOrder(id: string) {
    const order = await this.prisma.salesOrder.update({
      where: { id },
      data: { status: 'PENDING_COLLECT' },
    });

    // تفعيل كل POs المرتبطة
    await this.prisma.purchaseOrder.updateMany({
      where: { soId: id },
      data: { status: 'PENDING_VENDOR_CONFIRM' },
    });

    return { message: 'Order confirmed successfully', order };
  }

  // ❌ رفض الطلب
  async rejectOrder(id: string, reason?: string) {
    const order = await this.prisma.salesOrder.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason: reason || 'No reason provided',
      },
    });

    return {
      message: `Order rejected${reason ? ': ' + reason : ''}`,
      order,
    };
  }


  // ✅ عرض طلبات التاجر المعلقة
  async findVendorPOs(user: any) {
    const vendor = await this.prisma.vendor.findUnique({ where: { userId: user.id } });
    if (!vendor) throw new ForbiddenException('Vendor not found');

    return this.prisma.purchaseOrder.findMany({
      where: { vendorId: vendor.id },
      include: { items: { include: { product: true } }, salesOrder: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ✅ تأكيد الـ PO من التاجر
  async confirmPO(id: string, user: any) {
    const vendor = await this.prisma.vendor.findUnique({ where: { userId: user.id } });
    if (!vendor) throw new ForbiddenException('Vendor not found');

    const po = await this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'CONFIRMED_BY_VENDOR', rejectionReason: null },
    });

    // التحقق من جميع POs المرتبطة بـ SO
    const allPOs = await this.prisma.purchaseOrder.findMany({ where: { soId: po.soId } });
    const allConfirmed = allPOs.every((p) => p.status === 'CONFIRMED_BY_VENDOR');

    // إذا تم تأكيد جميع الـ POs → يتم تحويل الـ SO إلى READY_FOR_DISPATCH
    if (allConfirmed) {
      await this.prisma.salesOrder.update({
        where: { id: po.soId },
        data: { status: 'READY_FOR_DISPATCH' },
      });
    }

    return { message: 'PO confirmed successfully', po };
  }

  // ❌ رفض الـ PO من التاجر
  async rejectPO(id: string, reason: string, user: any) {
    const vendor = await this.prisma.vendor.findUnique({ where: { userId: user.id } });
    if (!vendor) throw new ForbiddenException('Vendor not found');

    const po = await this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'REJECTED', rejectionReason: reason },
    });
    

    // إذا رفض التاجر أحد POs → يتم وضع الـ SO في حالة PENDING_REVIEW
    await this.prisma.salesOrder.update({
      where: { id: po.soId },
      data: { status: 'PENDING_COLLECT' },
    });
    

    return { message: `PO rejected: ${reason}`, po };
  }


  // ✅ التاجر يجهز البضاعة ويجعلها جاهزة للاستلام
async markReadyForPickup(poId: string, user: any) {
  const vendor = await this.prisma.vendor.findUnique({ where: { userId: user.id } });
  if (!vendor) throw new ForbiddenException('Vendor not found');

  const po = await this.prisma.purchaseOrder.update({
    where: { id: poId, vendorId: vendor.id },
    data: { status: 'READY_FOR_PICKUP' },
  });

  return { message: 'PO marked as READY_FOR_PICKUP', po };
}


// ✅ السائق يستلم الطلب من التاجر
async markInTransit(poId: string, user: any) {
  if (user.role !== 'DRIVER' && user.role !== 'DISPATCHER') {
    throw new ForbiddenException('Only driver/dispatcher can perform this action');
  }

  const po = await this.prisma.purchaseOrder.update({
    where: { id: poId },
    data: { status: 'IN_TRANSIT_TO_WAREHOUSE' },
  });

  return { message: 'PO marked as IN_TRANSIT_TO_WAREHOUSE', po };
}



// ✅ المستودع يؤكد استلام البضاعة
async markReceivedAtWarehouse(poId: string, user: any) {
  if (user.role !== 'WAREHOUSE' && user.role !== 'ADMIN') {
    throw new ForbiddenException('Only warehouse/admin staff can mark this');
  }

  const po = await this.prisma.purchaseOrder.update({
    where: { id: poId },
    data: { status: 'RECEIVED_AT_WAREHOUSE' },
  });

  return { message: 'PO marked as RECEIVED_AT_WAREHOUSE', po };
}

}
