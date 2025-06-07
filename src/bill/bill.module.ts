import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { BillService } from './bill.service';
import { BillController } from './bill.controller';
import { ExternalBillPaymentService } from './services/external-bill-payment.service';
import { WalletModule } from '../wallet/wallet.module';
import { TransactionModule } from '../transaction/transaction.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'bill-payment',
    }),
    WalletModule,
    TransactionModule,
  ],
  controllers: [BillController],
  providers: [BillService, ExternalBillPaymentService],
  exports: [BillService],
})
export class BillModule {}
