import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { WalletModule } from './wallet/wallet.module';
import { BillModule } from './bill/bill.module';
import { TransactionModule } from './transaction/transaction.module';
import { QueueModule } from './queue/queue.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT),
        // password: process.env.REDIS_PASSWORD,
        tls: process.env.REDIS_HOST !== 'localhost' ? {} : undefined,

        maxRetriesPerRequest: null,
        enableReadyCheck: false,

        lazyConnect: false,
        connectTimeout: 60000,
        commandTimeout: 30000,
        family: 4,
        db: 0,
      },
      settings: {
        stalledInterval: 30 * 1000,
        maxStalledCount: 1,
        retryProcessDelay: 2 * 1000,
      },
      defaultJobOptions: {
        removeOnComplete: 10,
        removeOnFail: 10,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        // Add timeout to prevent hanging jobs
        timeout: 60000,
      },
      prefix: 'bill-vending',
    }),
    WalletModule,
    BillModule,
    TransactionModule,
    QueueModule,
    UserModule,
  ],
})
export class AppModule {}
