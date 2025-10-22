import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private retryCount = 0;
  private readonly maxRetries = 5;
  private readonly retryDelay = 3000; // 3 ثوانٍ بين المحاولات

  async onModuleInit() {
    await this.connectWithRetry();
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.warn('🧹 Disconnected from PostgreSQL');
  }

  private async connectWithRetry(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('✅ Connected to PostgreSQL via Prisma');
      this.retryCount = 0;
    } catch (error) {
      this.retryCount++;
      this.logger.error(`❌ Database connection failed (attempt ${this.retryCount})`);
      if (this.retryCount < this.maxRetries) {
        this.logger.warn(`⏳ Retrying in ${this.retryDelay / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
        await this.connectWithRetry();
      } else {
        this.logger.error('🚨 Max retries reached. Could not connect to database.');
        throw error;
      }
    }
  }
}
