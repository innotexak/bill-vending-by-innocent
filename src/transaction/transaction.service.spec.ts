import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TransactionService } from './transaction.service';
import { Transaction, TransactionDocument } from './schemas/transaction.schema';
import { TransactionStatus } from '../common/enums/transaction-status.enum';
import { TransactionType } from '../common/enums/transaction-type.enum';
import { TransactionNotFoundException } from '../common/exceptions';

describe('TransactionService', () => {
  let service: TransactionService;
  let model: Model<TransactionDocument>;

  const mockTransaction = {
    transactionId: 'txn-123',
    userId: 'user-456',
    amount: 100,
    type: TransactionType.BILL_PAYMENT,
    status: TransactionStatus.PENDING,
    billDetails: {
      billType: 'electricity',
      accountNumber: 'ACC123',
      meterNumber: 'METER456',
    },
    metadata: { source: 'mobile_app' },
    createdAt: new Date(),
    save: jest.fn(),
  };

  // Create a properly typed mock that extends both constructor and static methods
  const mockTransactionModel = jest.fn().mockImplementation(() => ({
    ...mockTransaction,
    save: jest.fn().mockResolvedValue(mockTransaction),
  })) as any;

  // Add static methods using Object.assign to avoid TypeScript errors
  Object.assign(mockTransactionModel, {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    create: jest.fn(),
    exec: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionService,
        {
          provide: getModelToken(Transaction.name),
          useValue: mockTransactionModel,
        },
      ],
    }).compile();

    service = module.get<TransactionService>(TransactionService);
    model = module.get<Model<TransactionDocument>>(
      getModelToken(Transaction.name),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTransaction', () => {
    it('should create a transaction successfully', async () => {
      const transactionData = {
        transactionId: 'txn-123',
        userId: 'user-456',
        amount: 100,
        type: TransactionType.BILL_PAYMENT,
        billDetails: {
          billType: 'electricity',
          accountNumber: 'ACC123',
          meterNumber: 'METER456',
        },
        metadata: { source: 'mobile_app' },
      };

      const savedTransaction = {
        ...mockTransaction,
        ...transactionData,
      };

      // Mock the save method to return the saved transaction
      const mockSave = jest.fn().mockResolvedValue(savedTransaction);
      (model as any).mockReturnValue({
        ...transactionData,
        status: TransactionStatus.PENDING,
        save: mockSave,
      });

      const result = await service.createTransaction(
        transactionData.transactionId,
        transactionData.userId,
        transactionData.amount,
        transactionData.type,
        transactionData.billDetails,
        transactionData.metadata,
      );

      expect(model).toHaveBeenCalledWith({
        transactionId: transactionData.transactionId,
        userId: transactionData.userId,
        amount: transactionData.amount,
        type: transactionData.type,
        status: TransactionStatus.PENDING,
        billDetails: transactionData.billDetails,
        metadata: transactionData.metadata,
      });
      expect(result).toEqual(savedTransaction);
    });

    it('should create a transaction without optional parameters', async () => {
      const transactionData = {
        transactionId: 'txn-124',
        userId: 'user-457',
        amount: 50,
        type: TransactionType.REVERSAL,
      };

      const savedTransaction = {
        ...transactionData,
        status: TransactionStatus.PENDING,
      };

      const mockSave = jest.fn().mockResolvedValue(savedTransaction);
      (model as any).mockReturnValue({
        ...transactionData,
        status: TransactionStatus.PENDING,
        save: mockSave,
      });

      const result = await service.createTransaction(
        transactionData.transactionId,
        transactionData.userId,
        transactionData.amount,
        transactionData.type,
      );

      expect(model).toHaveBeenCalledWith({
        transactionId: transactionData.transactionId,
        userId: transactionData.userId,
        amount: transactionData.amount,
        type: transactionData.type,
        status: TransactionStatus.PENDING,
        billDetails: undefined,
        metadata: undefined,
      });
      expect(result).toEqual(savedTransaction);
    });

    it('should handle database errors during transaction creation', async () => {
      const mockSave = jest.fn().mockRejectedValue(new Error('Database error'));
      (model as any).mockReturnValue({
        save: mockSave,
      });

      await expect(
        service.createTransaction(
          'txn-error',
          'user-error',
          100,
          TransactionType.BILL_PAYMENT,
        ),
      ).rejects.toThrow('Database error');
    });
  });

  describe('updateTransactionStatus', () => {
    it('should update transaction status successfully', async () => {
      const updatedTransaction = {
        ...mockTransaction,
        status: TransactionStatus.COMPLETED,
        externalTransactionId: 'ext-123',
        completedAt: expect.any(Date),
      };

      (model.findOneAndUpdate as jest.Mock).mockResolvedValue(
        updatedTransaction,
      );

      const result = await service.updateTransactionStatus(
        'txn-123',
        TransactionStatus.COMPLETED,
        'ext-123',
      );

      expect(model.findOneAndUpdate).toHaveBeenCalledWith(
        { transactionId: 'txn-123' },
        {
          status: TransactionStatus.COMPLETED,
          externalTransactionId: 'ext-123',
          failureReason: undefined,
          completedAt: expect.any(Date),
        },
        { new: true },
      );
      expect(result).toEqual(updatedTransaction);
    });

    it('should update transaction status with failure reason', async () => {
      const updatedTransaction = {
        ...mockTransaction,
        status: TransactionStatus.FAILED,
        failureReason: 'Insufficient funds',
      };

      (model.findOneAndUpdate as jest.Mock).mockResolvedValue(
        updatedTransaction,
      );

      const result = await service.updateTransactionStatus(
        'txn-123',
        TransactionStatus.FAILED,
        undefined,
        'Insufficient funds',
      );

      expect(model.findOneAndUpdate).toHaveBeenCalledWith(
        { transactionId: 'txn-123' },
        {
          status: TransactionStatus.FAILED,
          externalTransactionId: undefined,
          failureReason: 'Insufficient funds',
        },
        { new: true },
      );
      expect(result).toEqual(updatedTransaction);
    });

    it('should not add completedAt for non-completed status', async () => {
      const updatedTransaction = {
        ...mockTransaction,
        status: TransactionStatus.FAILED,
      };

      (model.findOneAndUpdate as jest.Mock).mockResolvedValue(
        updatedTransaction,
      );

      await service.updateTransactionStatus(
        'txn-123',
        TransactionStatus.FAILED,
      );

      expect(model.findOneAndUpdate).toHaveBeenCalledWith(
        { transactionId: 'txn-123' },
        {
          status: TransactionStatus.FAILED,
          externalTransactionId: undefined,
          failureReason: undefined,
        },
        { new: true },
      );
    });

    it('should throw TransactionNotFoundException when transaction not found', async () => {
      (model.findOneAndUpdate as jest.Mock).mockResolvedValue(null);

      await expect(
        service.updateTransactionStatus(
          'non-existent',
          TransactionStatus.COMPLETED,
        ),
      ).rejects.toThrow(TransactionNotFoundException);

      expect(model.findOneAndUpdate).toHaveBeenCalledWith(
        { transactionId: 'non-existent' },
        {
          status: TransactionStatus.COMPLETED,
          externalTransactionId: undefined,
          failureReason: undefined,
          completedAt: expect.any(Date),
        },
        { new: true },
      );
    });
  });

  describe('getTransaction', () => {
    it('should return transaction when found', async () => {
      (model.findOne as jest.Mock).mockResolvedValue(mockTransaction);

      const result = await service.getTransaction('txn-123');

      expect(model.findOne).toHaveBeenCalledWith({
        transactionId: 'txn-123',
      });
      expect(result).toEqual(mockTransaction);
    });

    it('should throw TransactionNotFoundException when transaction not found', async () => {
      (model.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.getTransaction('non-existent')).rejects.toThrow(
        TransactionNotFoundException,
      );

      expect(model.findOne).toHaveBeenCalledWith({
        transactionId: 'non-existent',
      });
    });

    it('should handle database errors', async () => {
      (model.findOne as jest.Mock).mockRejectedValue(
        new Error('Database connection error'),
      );

      await expect(service.getTransaction('txn-123')).rejects.toThrow(
        'Database connection error',
      );
    });
  });

  describe('getUserTransactions', () => {
    it('should return user transactions sorted by creation date', async () => {
      const userTransactions = [
        { ...mockTransaction, createdAt: new Date('2023-01-02') },
        { ...mockTransaction, createdAt: new Date('2023-01-01') },
      ];

      const mockQuery = {
        sort: jest.fn().mockResolvedValue(userTransactions),
      };

      (model.find as jest.Mock).mockReturnValue(mockQuery);

      const result = await service.getUserTransactions('user-456');

      expect(model.find).toHaveBeenCalledWith({ userId: 'user-456' });
      expect(mockQuery.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(result).toEqual(userTransactions);
    });

    it('should return empty array when user has no transactions', async () => {
      const mockQuery = {
        sort: jest.fn().mockResolvedValue([]),
      };

      (model.find as jest.Mock).mockReturnValue(mockQuery);

      const result = await service.getUserTransactions('user-no-transactions');

      expect(model.find).toHaveBeenCalledWith({
        userId: 'user-no-transactions',
      });
      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      const mockQuery = {
        sort: jest.fn().mockRejectedValue(new Error('Database error')),
      };

      (model.find as jest.Mock).mockReturnValue(mockQuery);

      await expect(service.getUserTransactions('user-456')).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('markAsReversed', () => {
    it('should mark transaction as reversed successfully', async () => {
      const reversedTransaction = {
        ...mockTransaction,
        status: TransactionStatus.REVERSED,
        reversalTransactionId: 'reversal-123',
      };

      (model.findOneAndUpdate as jest.Mock).mockResolvedValue(
        reversedTransaction,
      );

      const result = await service.markAsReversed('txn-123', 'reversal-123');

      expect(model.findOneAndUpdate).toHaveBeenCalledWith(
        { transactionId: 'txn-123' },
        {
          status: TransactionStatus.REVERSED,
          reversalTransactionId: 'reversal-123',
        },
        { new: true },
      );
      expect(result).toEqual(reversedTransaction);
    });

    it('should throw TransactionNotFoundException when transaction not found', async () => {
      (model.findOneAndUpdate as jest.Mock).mockResolvedValue(null);

      await expect(
        service.markAsReversed('non-existent', 'reversal-123'),
      ).rejects.toThrow(TransactionNotFoundException);

      expect(model.findOneAndUpdate).toHaveBeenCalledWith(
        { transactionId: 'non-existent' },
        {
          status: TransactionStatus.REVERSED,
          reversalTransactionId: 'reversal-123',
        },
        { new: true },
      );
    });

    it('should handle database errors during reversal', async () => {
      (model.findOneAndUpdate as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        service.markAsReversed('txn-123', 'reversal-123'),
      ).rejects.toThrow('Database error');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle invalid transaction types', async () => {
      const mockSave = jest
        .fn()
        .mockRejectedValue(new Error('Invalid transaction type'));
      (model as any).mockReturnValue({
        save: mockSave,
      });

      await expect(
        service.createTransaction(
          'txn-invalid',
          'user-456',
          100,
          'INVALID_TYPE' as any,
        ),
      ).rejects.toThrow('Invalid transaction type');
    });

    it('should handle negative amounts', async () => {
      const mockSave = jest
        .fn()
        .mockRejectedValue(new Error('Amount must be positive'));
      (model as any).mockReturnValue({
        save: mockSave,
      });

      await expect(
        service.createTransaction(
          'txn-negative',
          'user-456',
          -100,
          TransactionType.BILL_PAYMENT,
        ),
      ).rejects.toThrow('Amount must be positive');
    });

    it('should handle concurrent updates gracefully', async () => {
      (model.findOneAndUpdate as jest.Mock).mockRejectedValue(
        new Error(
          'WriteConflictError: Operation failed due to version mismatch',
        ),
      );

      await expect(
        service.updateTransactionStatus(
          'txn-conflict',
          TransactionStatus.COMPLETED,
        ),
      ).rejects.toThrow('WriteConflictError');
    });
  });
});
