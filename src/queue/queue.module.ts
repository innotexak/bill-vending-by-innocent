import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { BillPaymentProcessor } from './processors/bill-payment.processor';
import { BillModule } from '../bill/bill.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'bill-payment',
    }),
    BillModule,
  ],
  providers: [BillPaymentProcessor],
})
export class QueueModule {}
