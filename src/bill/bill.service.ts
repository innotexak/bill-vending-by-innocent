import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
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

// Interface definition
export interface IReversalData {
  transactionId: string;
  userId: string;
  amount: number;
  reason: string;
}

// DTO for processing bill payment queue data
export interface IBillPaymentProcessData {
  transactionId: string;
  userId: string;
  billType: string;
  accountNumber: string;
  amount: number;
  meterNumber?: string;
}

interface IBillDetails {
  billType: string;
  accountNumber: string;
  meterNumber?: string;
}
@Injectable()
export class BillService implements OnModuleInit {
  private readonly logger = new Logger(BillService.name);

  constructor(
    private readonly walletService: WalletService,
    private readonly transactionService: TransactionService,
    private readonly externalBillPaymentService: ExternalBillPaymentService,
    @InjectQueue('bill-payment') private billPaymentQueue: Queue,
  ) {}

  //Init redis monitoring
  async onModuleInit() {
    await this.setupRedisMonitoring();
  }

  /**
   * Method to setup Redis monitoring
   * This method will be called when the module is initialized
   * It sets up event listeners for Redis connection and error events
   * It also tests the Redis connection by sending a ping command
   * If the connection is successful, it logs a success message
   * If there is an error, it logs the error message
   **/
  private async setupRedisMonitoring() {
    try {
      const redisClient = this.billPaymentQueue.client;

      redisClient.on('connect', () => {
        this.logger.log('✅ Redis connected successfully');
      });

      redisClient.on('error', (error) => {
        console.log(error);
        this.logger.error(`❌ Redis error: ${error.message}`);
      });

      // Test connection
      await redisClient.ping();
      this.logger.log('✅ Redis ping successful');
    } catch (error) {
      this.logger.error(`❌ Redis connection failed: ${error.message}`);
    }
  }
  /** 
    Method to pay bill
    This method processes the bill payment by creating a transaction,
    deducting the amount from the user's wallet, and queuing the payment for processing
    It handles errors by rolling back the wallet deduction and updating the transaction status
    It returns the transaction ID and status to the caller
    If the payment fails, it queues a reversal process to refund the amount to the user's wallet
    It also logs the process for monitoring and debugging purposes
  **/
  async payBill(payBillDto: PayBillDto, userId: string) {
    const { billType, accountNumber, amount, meterNumber } = payBillDto;
    const transactionId = uuidv4();
    let walletDebited = false;

    this.logger.log(
      `Processing bill payment for user ${userId}, amount ${amount}`,
    );

    const billDetails: IBillDetails = {
      billType,
      accountNumber,
      meterNumber,
    };

    try {
      // Create transaction record
      await this.transactionService.createTransaction(
        transactionId,
        userId,
        amount,
        TransactionType.BILL_PAYMENT,
        billDetails,
      );

      // Deduct amount from wallet (with concurrency control)
      await this.walletService.deductAmount(userId, amount);
      walletDebited = true; // Mark that wallet was debited

      // Update transaction status to processing
      await this.transactionService.updateTransactionStatus(
        transactionId,
        TransactionStatus.PROCESSING,
      );

      // Queue the bill payment for async processing
      const queueData: IBillPaymentProcessData = {
        transactionId,
        userId,
        billType,
        accountNumber,
        amount,
        meterNumber,
      };

      await this.billPaymentQueue.add('process-payment', queueData);

      this.logger.log(`Bill payment queued for processing: ${transactionId}`);

      return {
        transactionId,
        status: TransactionStatus.PROCESSING,
        message: 'Payment is being processed',
      };
    } catch (error) {
      this.logger.error(`Failed to initiate bill payment: ${error.message}`);

      // Rollback wallet deduction if it was successful
      if (walletDebited) {
        try {
          await this.walletService.refundAmount(userId, amount);
          this.logger.log(
            `Refunded ${amount} to user ${userId} due to payment failure`,
          );
        } catch (refundError) {
          this.logger.error(
            `CRITICAL: Failed to refund ${amount} to user ${userId}: ${refundError.message}`,
          );
          // In real life application, I will alert the support team or switch processing of refund for manual intervention
        }
      }

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

  /**
   * Method to process bill payment
   * This method is called by the bill payment queue to process the payment
   * It handles the actual interaction with the external bill payment service
   * It updates the transaction status based on the response from the external service
   * If the payment fails, it queues a reversal process to refund the amount to the user's wallet
   */
  async processBillPayment(data: IBillPaymentProcessData) {
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
        const reversalData: IReversalData = {
          transactionId,
          userId,
          amount,
          reason: response.message,
        };

        await this.billPaymentQueue.add('process-reversal', reversalData);

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
      const reversalData: IReversalData = {
        transactionId,
        userId,
        amount,
        reason: error.message,
      };

      await this.billPaymentQueue.add('process-reversal', reversalData);
    }
  }

  /**
   * Method to process reversal of a transaction
   * This method is called when a transaction needs to be reversed
   * It creates a new reversal transaction, refunds the amount to the user's wallet,
   * and updates the original transaction status
   */
  async processReversal(data: IReversalData) {
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
