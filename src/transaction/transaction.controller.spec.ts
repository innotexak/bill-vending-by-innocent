import { Test, TestingModule } from '@nestjs/testing';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { mockUserDecorator } from '../common/decorator/mock/mock.getCurrentUser';

mockUserDecorator();

describe('TransactionController', () => {
  let controller: TransactionController;
  let service: TransactionService;

  const mockTransactionService = {
    getTransaction: jest.fn(),
    getUserTransactions: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionController],
      providers: [
        {
          provide: TransactionService,
          useValue: mockTransactionService,
        },
      ],
    }).compile();

    controller = module.get<TransactionController>(TransactionController);
    service = module.get<TransactionService>(TransactionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getTransaction', () => {
    const mockTransaction = {
      id: 'txn123',
      userId: 'user123',
      type: 'BILL_PAYMENT',
      amount: 100,
      status: 'COMPLETED',
      billType: 'ELECTRICITY',
      accountNumber: '1234567890',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should successfully retrieve transaction by ID', async () => {
      mockTransactionService.getTransaction.mockResolvedValue(mockTransaction);

      const result = await controller.getTransaction('userId', 'txn123');

      expect(result).toEqual({
        success: true,
        message: 'Transaction retrieved successfully',
        data: mockTransaction,
        timestamp: expect.any(Date),
      });
      expect(mockTransactionService.getTransaction).toHaveBeenCalledWith(
        'txn123',
      );
      expect(mockTransactionService.getTransaction).toHaveBeenCalledTimes(1);
    });

    it('should handle transaction not found error', async () => {
      const errorMessage = 'Transaction not found';
      mockTransactionService.getTransaction.mockRejectedValue(
        new Error(errorMessage),
      );

      const result = await controller.getTransaction('userId', 'nonexistent');

      expect(result).toEqual({
        success: false,
        message: 'Failed to retrieve transaction',
        error: errorMessage,
        timestamp: expect.any(Date),
      });
      expect(mockTransactionService.getTransaction).toHaveBeenCalledWith(
        'nonexistent',
      );
    });

    it('should handle invalid transaction ID format', async () => {
      const errorMessage = 'Invalid transaction ID format';
      mockTransactionService.getTransaction.mockRejectedValue(
        new Error(errorMessage),
      );

      const result = await controller.getTransaction('userId', 'invalid-id');

      expect(result).toEqual({
        success: false,
        message: 'Failed to retrieve transaction',
        error: errorMessage,
        timestamp: expect.any(Date),
      });
    });

    it('should handle database connection error', async () => {
      const errorMessage = 'Database connection failed';
      mockTransactionService.getTransaction.mockRejectedValue(
        new Error(errorMessage),
      );

      const result = await controller.getTransaction('useId', 'txn123');

      expect(result).toEqual({
        success: false,
        message: 'Failed to retrieve transaction',
        error: errorMessage,
        timestamp: expect.any(Date),
      });
    });
  });

  describe('getUserTransactions', () => {
    const mockTransactions = [
      {
        id: 'txn123',
        userId: 'user123',
        type: 'BILL_PAYMENT',
        amount: 100,
        status: 'COMPLETED',
        billType: 'ELECTRICITY',
        accountNumber: '1234567890',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'txn456',
        userId: 'user123',
        type: 'WALLET_FUNDING',
        amount: 500,
        status: 'COMPLETED',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it('should successfully retrieve user transactions', async () => {
      mockTransactionService.getUserTransactions.mockResolvedValue(
        mockTransactions,
      );

      const result = await controller.getUserTransactions('user123');

      expect(result).toEqual({
        success: true,
        message: 'Transactions retrieved successfully',
        data: mockTransactions,
        timestamp: expect.any(Date),
      });
      expect(mockTransactionService.getUserTransactions).toHaveBeenCalledWith(
        'user123',
      );
      expect(mockTransactionService.getUserTransactions).toHaveBeenCalledTimes(
        1,
      );
    });

    it('should return empty array for user with no transactions', async () => {
      mockTransactionService.getUserTransactions.mockResolvedValue([]);

      const result = await controller.getUserTransactions('user456');

      expect(result).toEqual({
        success: true,
        message: 'Transactions retrieved successfully',
        data: [],
        timestamp: expect.any(Date),
      });
      expect(mockTransactionService.getUserTransactions).toHaveBeenCalledWith(
        'user456',
      );
    });

    it('should handle user not found error', async () => {
      const errorMessage = 'User not found';
      mockTransactionService.getUserTransactions.mockRejectedValue(
        new Error(errorMessage),
      );

      const result = await controller.getUserTransactions('nonexistent');

      expect(result).toEqual({
        success: false,
        message: 'Failed to retrieve transactions',
        error: errorMessage,
        timestamp: expect.any(Date),
      });
      expect(mockTransactionService.getUserTransactions).toHaveBeenCalledWith(
        'nonexistent',
      );
    });

    it('should handle invalid user ID format', async () => {
      const errorMessage = 'Invalid user ID format';
      mockTransactionService.getUserTransactions.mockRejectedValue(
        new Error(errorMessage),
      );

      const result = await controller.getUserTransactions('invalid-user-id');

      expect(result).toEqual({
        success: false,
        message: 'Failed to retrieve transactions',
        error: errorMessage,
        timestamp: expect.any(Date),
      });
    });

    it('should handle database query error', async () => {
      const errorMessage = 'Database query failed';
      mockTransactionService.getUserTransactions.mockRejectedValue(
        new Error(errorMessage),
      );

      const result = await controller.getUserTransactions('user123');

      expect(result).toEqual({
        success: false,
        message: 'Failed to retrieve transactions',
        error: errorMessage,
        timestamp: expect.any(Date),
      });
    });
  });
});
