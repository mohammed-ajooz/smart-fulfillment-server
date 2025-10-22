import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      include: { vendor: true, customer: true, staffProfile: true },
    });
  }
  async findOne(id: string) {
  return this.prisma.user.findUnique({
    where: { id },
    include: {
      vendor: true,
      customer: true,
      staffProfile: true,
    },
  });
}


  async getProfile(user: any) {
    // ADMIN sees everything
    if (user.role === 'ADMIN') {
      return this.prisma.user.findMany({
        include: { vendor: true, customer: true, staffProfile: true },
      });
    }

    // VENDOR sees only his vendor profile
    if (user.role === 'VENDOR') {
      return this.prisma.user.findUnique({
        where: { id: user.id },
        include: { vendor: true },
      });
    }

    // CUSTOMER sees his own profile
    if (user.role === 'CUSTOMER') {
      return this.prisma.user.findUnique({
        where: { id: user.id },
        include: { customer: true },
      });
    }

    // STAFF or DRIVER or FINANCE — limited
    if (['STAFF', 'DRIVER', 'FINANCE'].includes(user.role)) {
      return this.prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
        },
      });
    }

    throw new ForbiddenException('Access denied');
  }
}
