import {
  Process,
  Processor,
  OnQueueActive,
  OnQueueProgress,
  OnQueueCompleted,
  OnQueueFailed,
} from '@nestjs/bull';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { Job } from 'bull';
import { BillService } from '../../bill/bill.service';

@Processor('bill-payment')
export class BillPaymentProcessor {
  private readonly logger = new Logger(BillPaymentProcessor.name);

  constructor(
    @Inject(forwardRef(() => BillService))
    private readonly billService: BillService,
  ) {
    this.logger.log('🚀 BillPaymentProcessor initialized!');
  }

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.log(`Job ${job.id} is now active`);
  }

  @OnQueueProgress()
  onProgress(job: Job, progress: number) {
    this.logger.log(`Job ${job.id} progress: ${progress}%`);
  }

  @OnQueueCompleted()
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} completed successfully`);
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed: ${error.message}`);
  }

  @Process('process-payment')
  async handlePayment(job: Job) {
    this.logger.log(`Processing payment job: ${job.id} with data:`, job.data);

    try {
      await this.billService.processBillPayment(job.data);
      this.logger.log(`Payment job completed: ${job.id}`);
      return { success: true, jobId: job.id };
    } catch (error) {
      this.logger.error(`Payment job failed: ${job.id}`, error.stack);
      throw error; // Let Bull handle retries
    }
  }

  @Process('process-reversal')
  async handleReversal(job: Job) {
    this.logger.log(`Processing reversal job: ${job.id} with data:`, job.data);

    try {
      await this.billService.processReversal(job.data);
      this.logger.log(`Reversal job completed: ${job.id}`);
      return { success: true, jobId: job.id };
    } catch (error) {
      this.logger.error(`Reversal job failed: ${job.id}`, error.stack);
      throw error;
    }
  }
}
