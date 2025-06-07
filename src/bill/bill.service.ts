import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { v4 as uuidv4 } from 'uuid';
import { WalletService } from '../wallet/wallet.service';
import { TransactionService } from '../transaction/transaction.service';
import {
  ExternalBillPaymentService,
  BillPaymentRequest,
} from './services/external-bill-payment.service';
import { PayBillDto } from './dto/pay-bill.dto';
import { TransactionType } from '../common/enums/transaction-type.enum';
import { TransactionStatus } from '../common/enums/transaction-status.enum';

@Injectable()
export class BillService {
  private readonly logger = new Logger(BillService.name);

  constructor(
    private readonly walletService: WalletService,
    private readonly transactionService: TransactionService,
    private readonly externalBillPaymentService: ExternalBillPaymentService,
    @InjectQueue('bill-payment') private billPaymentQueue: Queue,
  ) {}

  async payBill(payBillDto: PayBillDto) {
    const { userId, billType, accountNumber, amount, meterNumber } = payBillDto;
    const transactionId = uuidv4();

    this.logger.log(
      `Processing bill payment for user ${userId}, amount ${amount}`,
    );

    try {
      // 1. Create transaction record
      await this.transactionService.createTransaction(
        transactionId,
        userId,
        amount,
        TransactionType.BILL_PAYMENT,
        { billType, accountNumber, meterNumber },
      );

      // 2. Deduct amount from wallet (with concurrency control)
      await this.walletService.deductAmount(userId, amount);

      // 3. Update transaction status to processing
      await this.transactionService.updateTransactionStatus(
        transactionId,
        TransactionStatus.PROCESSING,
      );

      // 4. Queue the bill payment for async processing
      await this.billPaymentQueue.add('process-payment', {
        transactionId,
        userId,
        billType,
        accountNumber,
        amount,
        meterNumber,
      });

      this.logger.log(`Bill payment queued for processing: ${transactionId}`);

      return {
        transactionId,
        status: TransactionStatus.PROCESSING,
        message: 'Payment is being processed',
      };
    } catch (error) {
      this.logger.error(`Failed to initiate bill payment: ${error.message}`);

      // Update transaction status to failed
      try {
        await this.transactionService.updateTransactionStatus(
          transactionId,
          TransactionStatus.FAILED,
          undefined,
          error.message,
        );
      } catch (updateError) {
        this.logger.error(
          `Failed to update transaction status: ${updateError.message}`,
        );
      }

      throw error;
    }
  }

  async processBillPayment(data: any) {
    const {
      transactionId,
      userId,
      billType,
      accountNumber,
      amount,
      meterNumber,
    } = data;

    this.logger.log(`Processing bill payment: ${transactionId}`);

    try {
      const paymentRequest: BillPaymentRequest = {
        billType,
        accountNumber,
        amount,
        meterNumber,
        transactionId,
      };

      const response =
        await this.externalBillPaymentService.processPayment(paymentRequest);

      if (response.success) {
        // Payment successful
        await this.transactionService.updateTransactionStatus(
          transactionId,
          TransactionStatus.COMPLETED,
          response.externalTransactionId,
        );

        this.logger.log(
          `Bill payment completed successfully: ${transactionId}`,
        );
      } else {
        // Payment failed - trigger reversal
        await this.transactionService.updateTransactionStatus(
          transactionId,
          TransactionStatus.FAILED,
          undefined,
          response.message,
        );

        // Queue reversal process
        await this.billPaymentQueue.add('process-reversal', {
          transactionId,
          userId,
          amount,
          reason: response.message,
        });

        this.logger.log(
          `Bill payment failed, reversal queued: ${transactionId}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error processing bill payment ${transactionId}: ${error.message}`,
      );

      // Update transaction status and trigger reversal
      await this.transactionService.updateTransactionStatus(
        transactionId,
        TransactionStatus.FAILED,
        undefined,
        error.message,
      );

      // Queue reversal process
      await this.billPaymentQueue.add('process-reversal', {
        transactionId,
        userId,
        amount,
        reason: error.message,
      });
    }
  }

  async processReversal(data: any) {
    const { transactionId, userId, amount, reason } = data;
    const reversalTransactionId = uuidv4();

    this.logger.log(`Processing reversal for transaction: ${transactionId}`);

    try {
      // 1. Create reversal transaction
      await this.transactionService.createTransaction(
        reversalTransactionId,
        userId,
        amount,
        TransactionType.REVERSAL,
        undefined,
        { originalTransactionId: transactionId, reason },
      );

      // 2. Refund amount to wallet
      await this.walletService.refundAmount(userId, amount);

      // 3. Mark reversal transaction as completed
      await this.transactionService.updateTransactionStatus(
        reversalTransactionId,
        TransactionStatus.COMPLETED,
      );

      // 4. Mark original transaction as reversed
      await this.transactionService.markAsReversed(
        transactionId,
        reversalTransactionId,
      );

      this.logger.log(`Reversal completed for transaction: ${transactionId}`);
    } catch (error) {
      this.logger.error(
        `Failed to process reversal for ${transactionId}: ${error.message}`,
      );

      // Mark reversal transaction as failed
      try {
        await this.transactionService.updateTransactionStatus(
          reversalTransactionId,
          TransactionStatus.FAILED,
          undefined,
          error.message,
        );
      } catch (updateError) {
        this.logger.error(
          `Failed to update reversal transaction status: ${updateError.message}`,
        );
      }
    }
  }
}
