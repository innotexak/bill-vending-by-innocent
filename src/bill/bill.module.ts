import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { BillService } from './bill.service';
import { BillController } from './bill.controller';
import { WalletModule } from '../wallet/wallet.module';
import { TransactionModule } from '../transaction/transaction.module';
import { ExternalBillPaymentService } from './services/external-bill-payment.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'bill-payment',

      settings: {
        stalledInterval: 15 * 1000,
        maxStalledCount: 1,
      },
      defaultJobOptions: {
        removeOnComplete: 20,
        removeOnFail: 20,
        attempts: 5,
        delay: 0,
      },
    }),
    WalletModule,
    TransactionModule,
  ],
  providers: [BillService, ExternalBillPaymentService],
  controllers: [BillController],
  exports: [BillService],
})
export class BillModule {}
