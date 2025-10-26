import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DriversService {
  constructor(private prisma: PrismaService) {}

  // ✅ إضافة Driver جديد
  async create(data: any) {
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) throw new ForbiddenException('User with this email already exists');

    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash,
        role: 'DRIVER',
        status: 'ACTIVE',
      },
    });

    const driver = await this.prisma.driver.create({
      data: {
        userId: user.id,
        name: data.name,
        phone: data.phone,
        vehicleType: data.vehicleType,
        plateNumber: data.plateNumber,
      },
    });

    return { message: 'Driver created successfully', driver };
  }

  // ✅ عرض جميع السائقين
  async findAll() {
    return this.prisma.driver.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ✅ عرض سائق واحد
  async findOne(id: string) {
    return this.prisma.driver.findUnique({
      where: { id },
      include: { user: true },
    });
  }
}
