import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { BillService } from '../../bill/bill.service';

@Processor('bill-payment')
export class BillPaymentProcessor {
  private readonly logger = new Logger(BillPaymentProcessor.name);

  constructor(private readonly billService: BillService) {}

  @Process('process-payment')
  async handlePayment(job: Job) {
    this.logger.log(`Processing payment job: ${job.id}`);
    await this.billService.processBillPayment(job.data);
    this.logger.log(`Payment job completed: ${job.id}`);
  }

  @Process('process-reversal')
  async handleReversal(job: Job) {
    this.logger.log(`Processing reversal job: ${job.id}`);
    await this.billService.processReversal(job.data);
    this.logger.log(`Reversal job completed: ${job.id}`);
  }
}
