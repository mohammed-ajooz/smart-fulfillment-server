import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { DispatcherService } from './dispatcher.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import * as bcrypt from 'bcrypt';

@Controller('dispatchers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DispatcherController {
  constructor(private readonly dispatcherService: DispatcherService) {}

  // ✅ إنشاء Dispatcher جديد (ADMIN فقط)
  @Post()
  @Roles('ADMIN')
  async create(@Body() body: any) {
    const passwordHash = await bcrypt.hash(body.password, 10);
    return this.dispatcherService.create({ ...body, passwordHash });
  }

  // ✅ عرض جميع الـ Dispatchers (ADMIN فقط)
  @Get()
  @Roles('ADMIN')
  async findAll() {
    return this.dispatcherService.findAll();
  }
}
