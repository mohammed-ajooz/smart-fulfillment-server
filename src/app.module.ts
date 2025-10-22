import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';

import { UsersModule } from './users/users.module';
import { VendorsModule } from './vendors/vendors.module';
import { CustomersModule } from './customers/customers.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { FinanceModule } from './finance/finance.module';
import { AuthModule } from './auth/auth.module';
import { PrismaService } from './prisma/prisma.service';
import { CategoriesModule } from './categories/categories.module';



@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    VendorsModule,
    CustomersModule,
    ProductsModule,
    OrdersModule,
    FinanceModule,
    AuthModule,
    CategoriesModule,
    OrdersModule,
    
  ],
})
 
@Module({
  imports: [AuthModule, UsersModule, ProductsModule],
  providers: [PrismaService],
})
export class AppModule {}
