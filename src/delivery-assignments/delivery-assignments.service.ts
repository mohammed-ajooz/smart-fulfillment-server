import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DeliveryAssignmentsService {
  constructor(private prisma: PrismaService) { }

  // ✅ Dispatcher يقوم بتعيين سائق لطلب محدد
  async assignDriver(poId: string, driverId: string, user: any) {
    

    if (user.role !== 'STAFF' && user.role !== 'ADMIN') {
      throw new ForbiddenException('Only dispatcher or admin can assign drivers');
    }

    // التأكد من أن الطلب موجود
    const po = await this.prisma.purchaseOrder.findUnique({ where: { id: poId } });
    if (!po) throw new ForbiddenException('Purchase order not found');

    // التأكد من أن السائق صالح
    const driver = await this.prisma.driver.findUnique({ where: { id: driverId } });
    if (!driver) throw new ForbiddenException('Driver not found');
    // اجلب dispatcher عبر userId
  const dispatcher = await this.prisma.dispatcher.findUnique({
    where: { userId:user.id },
  });
  if (!dispatcher) {
    throw new ForbiddenException(
      `Dispatcher not found for userId: ${user.id}`,
    );
  }
console.log('📦 Assign Debug test:', { dispatcher,poId, driverId, userId: user.id, role: user.role });
 
    // إنشاء سجل الربط (DeliveryAssignment)
    const assignment = await this.prisma.deliveryAssignment.create({
      data: {
        poId,
        driverId,
        dispatcherId: dispatcher.id,
        status: 'ASSIGNED',
      },
    });

    // تحديث حالة الطلب إلى IN_TRANSIT_TO_WAREHOUSE
    await this.prisma.purchaseOrder.update({
      where: { id: poId },
      data: { status: 'IN_TRANSIT_TO_WAREHOUSE' },
    });

    return { message: 'Driver assigned successfully', assignment };
  }

  // ✅ عرض جميع المهام (للإدمن أو الموزع)
  async findAll() {
    return this.prisma.deliveryAssignment.findMany({
      include: {
        driver: true,
        dispatcher: true,
        purchaseOrder: true,
      },
      orderBy: { assignedAt: 'desc' },
    });
  }

  // ✅ عرض مهام سائق معين (للسائق نفسه)
  async findMyAssignments(driverUserId: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId: driverUserId },
    });
    if (!driver) throw new ForbiddenException('Driver profile not found');

    return this.prisma.deliveryAssignment.findMany({
      where: { driverId: driver.id },
      include: {
        purchaseOrder: true,
        dispatcher: true,
      },
    });
  }

  // ✅ تحديث الحالة (عند إكمال المهمة)
  async completeAssignment(id: string, user: any) {
    if (user.role !== 'DRIVER') throw new ForbiddenException('Only driver can complete assignments');

    const assignment = await this.prisma.deliveryAssignment.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    // تحديث حالة الطلب بعد التسليم
    await this.prisma.purchaseOrder.update({
      where: { id: assignment.poId },
      data: { status: 'RECEIVED_AT_WAREHOUSE' },
    });

    return { message: 'Assignment completed successfully', assignment };
  }

  // ✅ عرض جميع الطلبات الجاهزة للاستلام (Ready For Pickup)
  async findReadyForPickup() {
    return this.prisma.purchaseOrder.findMany({
      where: { status: 'READY_FOR_PICKUP' },
      include: {
        vendor: {
          select: {
            id: true,
            companyName: true,
            user: { select: { email: true, name: true } },
          },
        },
        salesOrder: {
          select: {
            id: true,
            orderCode: true,
            total: true,
            status: true,
            customer: {
              select: { id: true, user: { select: { name: true, email: true } } },
            },
          },
        },
        items: {
          select: {
            product: { select: { name: true, sku: true } },
            qty: true,
            price: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ✅ عرض جميع الطلبات الجاهزة لتعيين سائق
async getAllPOsForAssign() {
  return this.prisma.purchaseOrder.findMany({
    where: { status: 'READY_FOR_PICKUP' },
    include: {
      vendor: {
        select: {
          id: true,
          companyName: true,
          user: { select: { name: true, email: true } },
        },
      },
      salesOrder: {
        select: {
          id: true,
          orderCode: true,
          total: true,
          status: true,
          customer: {
            select: { user: { select: { name: true, email: true } } },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

// ✅ عرض جميع السائقين (للاختيار أثناء التعيين)
async getAllDrivers() {
  return this.prisma.driver.findMany({
    where: { active: true },
    select: {
      id: true,
      name: true,
      phone: true,
      vehicleType: true,
      plateNumber: true,
      user: { select: { email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

// ✅ 1. السائق يبدأ رحلة الاستلام
async startPickup(assignmentId: string, user: any) {
  if (user.role !== 'DRIVER')
    throw new ForbiddenException('Only driver can start pickup');

  const assignment = await this.prisma.deliveryAssignment.findUnique({
    where: { id: assignmentId },
    include: { purchaseOrder: true },
  });
  if (!assignment) throw new ForbiddenException('Assignment not found');

  // تحقق أن السائق هو صاحب المهمة
  const driver = await this.prisma.driver.findUnique({
    where: { userId: user.id },
  });
  if (!driver || assignment.driverId !== driver.id)
    throw new ForbiddenException('You are not assigned to this order');

  // تحديث حالة المهمة والطلب
  await this.prisma.deliveryAssignment.update({
    where: { id: assignmentId },
    data: {
      status: 'ON_THE_WAY_TO_VENDOR',
      startedAt: new Date(),
    },
  });

  await this.prisma.purchaseOrder.update({
    where: { id: assignment.poId },
    data: { status: 'ON_THE_WAY_TO_VENDOR' },
  });

  return { message: 'Pickup started successfully' };
}

// ✅ 2. السائق يؤكد استلام الطلب من التاجر
async confirmPickup(assignmentId: string, user: any) {
  if (user.role !== 'DRIVER')
    throw new ForbiddenException('Only driver can confirm pickup');

  const assignment = await this.prisma.deliveryAssignment.findUnique({
    where: { id: assignmentId },
    include: { purchaseOrder: true },
  });
  if (!assignment) throw new ForbiddenException('Assignment not found');

  const driver = await this.prisma.driver.findUnique({
    where: { userId: user.id },
  });
  if (!driver || assignment.driverId !== driver.id)
    throw new ForbiddenException('You are not assigned to this order');

  await this.prisma.deliveryAssignment.update({
    where: { id: assignmentId },
    data: {
      status: 'PICKED_UP',
      pickedUpAt: new Date(),
    },
  });

  await this.prisma.purchaseOrder.update({
    where: { id: assignment.poId },
    data: { status: 'PICKED_UP' },
  });

  return { message: 'Order picked up successfully' };
}


}
