import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Transaction, TransactionDocument } from './schemas/transaction.schema';
import { TransactionStatus } from '../common/enums/transaction-status.enum';
import { TransactionType } from '../common/enums/transaction-type.enum';
import { TransactionNotFoundException } from '../common/exceptions';

interface IBillDetails {
  billType: string;
  accountNumber: string;
  meterNumber?: string;
}
@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(
    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,
  ) {}

  /**
   * Creates a new transaction.
   * @param transactionId Unique identifier for the transaction.
   * @param userId ID of the user associated with the transaction.
   * @param amount Amount involved in the transaction.
   * @param type Type of the transaction (e.g., PAYMENT, REVERSAL).
   * @param billDetails Optional details about the bill associated with the transaction.
   * @param metadata Optional additional metadata for the transaction.
   * @returns The created transaction document.
   */
  async createTransaction(
    transactionId: string,
    userId: string,
    amount: number,
    type: TransactionType,
    billDetails?: IBillDetails,
    metadata?: Record<string, any>,
  ): Promise<Transaction> {
    const transaction = new this.transactionModel({
      transactionId,
      userId,
      amount,
      type,
      status: TransactionStatus.PENDING,
      billDetails,
      metadata,
    });

    const savedTransaction = await transaction.save();
    this.logger.log(`Transaction created: ${transactionId}`);
    return savedTransaction;
  }

  /**
   * Updates the status of an existing transaction.
   * @param transactionId Unique identifier for the transaction.
   * @param status New status for the transaction (e.g., COMPLETED, FAILED).
   * @param externalTransactionId Optional external ID for the transaction.
   * @param failureReason Optional reason for failure if the transaction failed.
   * @returns The updated transaction document.
   */
  async updateTransactionStatus(
    transactionId: string,
    status: TransactionStatus,
    externalTransactionId?: string,
    failureReason?: string,
  ): Promise<Transaction> {
    const transaction = await this.transactionModel.findOneAndUpdate(
      { transactionId },
      {
        status,
        externalTransactionId,
        failureReason,
        ...(status === TransactionStatus.COMPLETED && {
          completedAt: new Date(),
        }),
      },
      { new: true },
    );

    if (!transaction) {
      throw new TransactionNotFoundException(transactionId);
    }

    this.logger.log(`Transaction ${transactionId} status updated to ${status}`);
    return transaction;
  }

  /**
   * Retrieves a transaction by its ID.
   * @param transactionId Unique identifier for the transaction.
   * @returns The transaction document if found.
   * @throws TransactionNotFoundException if the transaction does not exist.
   */
  async getTransaction(transactionId: string): Promise<Transaction> {
    const transaction = await this.transactionModel.findOne({ transactionId });
    if (!transaction) {
      throw new TransactionNotFoundException(transactionId);
    }
    return transaction;
  }

  /**
   * Retrieves all transactions for a specific user, sorted by creation date.
   * @param userId ID of the user whose transactions are to be retrieved.
   * @returns An array of transaction documents for the user.
   */
  async getUserTransactions(userId: string): Promise<Transaction[]> {
    const result = await this.transactionModel
      .find({ userId })
      .sort({ createdAt: -1 });
    console.log(userId, result, 'fetched');
    return result;
  }

  /**
   * Marks a transaction as reversed.
   * @param transactionId Unique identifier for the original transaction.
   * @param reversalTransactionId Unique identifier for the reversal transaction.
   * @returns The updated transaction document with status set to REVERSED.
   * @throws TransactionNotFoundException if the original transaction does not exist.
   */
  async markAsReversed(
    transactionId: string,
    reversalTransactionId: string,
  ): Promise<Transaction> {
    const transaction = await this.transactionModel.findOneAndUpdate(
      { transactionId },
      {
        status: TransactionStatus.REVERSED,
        reversalTransactionId,
      },
      { new: true },
    );

    if (!transaction) {
      throw new TransactionNotFoundException(transactionId);
    }

    this.logger.log(`Transaction ${transactionId} marked as reversed`);
    return transaction;
  }
}
