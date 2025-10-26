import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DispatcherService {
  constructor(private prisma: PrismaService) {}

  // ✅ إضافة Dispatcher جديد
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
        role: 'STAFF',
        status: 'ACTIVE',
      },
    });

    const dispatcher = await this.prisma.dispatcher.create({
      data: {
        userId: user.id,
        name: data.name,
        phone: data.phone,
      },
    });

    return { message: 'Dispatcher created successfully', dispatcher };
  }

  // ✅ عرض جميع الـ Dispatchers
  async findAll() {
    return this.prisma.dispatcher.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ✅ عرض Dispatcher واحد
  async findOne(id: string) {
    return this.prisma.dispatcher.findUnique({
      where: { id },
      include: { user: true },
    });
  }
}
