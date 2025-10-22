import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // فقط ADMIN يستطيع رؤية كل المستخدمين
  @Get()
  @Roles('ADMIN')
  getAll() {
    return this.usersService.findAll();
  }

  // أي مستخدم يستطيع رؤية ملفه الشخصي فقط
  @Get('me')
  getProfile(@Req() req) {
    const user = req.user; // يأتي من jwt-auth.guard.ts
    return this.usersService.getProfile(user);
  }
}
