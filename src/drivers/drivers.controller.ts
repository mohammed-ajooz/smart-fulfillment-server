import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { DriversService } from './drivers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import * as bcrypt from 'bcrypt';

@Controller('drivers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  // ✅ إنشاء Driver جديد (ADMIN أو Dispatcher)
  @Post()
  @Roles('ADMIN', 'STAFF')
  async create(@Body() body: any) {
    const passwordHash = await bcrypt.hash(body.password, 10);
    return this.driversService.create({ ...body, passwordHash });
  }

  // ✅ عرض جميع السائقين (ADMIN أو Dispatcher)
  @Get()
  @Roles('ADMIN', 'STAFF')
  async findAll() {
    return this.driversService.findAll();
  }
}
