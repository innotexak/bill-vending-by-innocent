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
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/bill-vending',
    ),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT),

        // password: process.env.REDIS_PASSWORD, //
        tls: process.env.REDIS_HOST !== 'localhost' ? {} : undefined,
        maxRetriesPerRequest: 3,
        enableReadyCheck: false,
        lazyConnect: true,
      },
    }),
    WalletModule,
    BillModule,
    TransactionModule,
    QueueModule,
    UserModule,
  ],
})
export class AppModule {}
