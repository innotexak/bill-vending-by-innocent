import { mockUserDecorator } from '../common/decorator/mock/mock.getCurrentUser';
import { Test, TestingModule } from '@nestjs/testing';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { FundWalletDto } from './dto/fund-wallet.dto';

mockUserDecorator();
describe('WalletController', () => {
  let controller: WalletController;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let service: WalletService;

  const mockWalletService = {
    fundWallet: jest.fn(),
    getBalance: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WalletController],
      providers: [
        {
          provide: WalletService,
          useValue: mockWalletService,
        },
      ],
    }).compile();

    controller = module.get<WalletController>(WalletController);
    service = module.get<WalletService>(WalletService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('fundWallet', () => {
    const mockFundWalletDto: FundWalletDto = {
      amount: 500,
    };

    const mockWalletResult = {
      userId: 'user123',
      balance: 1000,
      lastUpdated: new Date(),
      transactionId: 'txn123',
    };

    it('should successfully fund wallet', async () => {
      mockWalletService.fundWallet.mockResolvedValue(mockWalletResult);

      const result = await controller.fundWallet('user123', mockFundWalletDto);

      expect(result).toEqual({
        success: true,
        message: 'Wallet funded successfully',
        data: mockWalletResult,
        timestamp: expect.any(Date),
      });
      expect(mockWalletService.fundWallet).toHaveBeenCalledWith(
        mockFundWalletDto,
        'user123',
      );
      expect(mockWalletService.fundWallet).toHaveBeenCalledTimes(1);
    });

    it('should handle invalid amount error', async () => {
      const errorMessage = 'Amount must be greater than 0';
      mockWalletService.fundWallet.mockRejectedValue(new Error(errorMessage));
      const result = await controller.fundWallet('user123', mockFundWalletDto);

      expect(result).toEqual({
        success: false,
        message: 'Failed to fund wallet',
        error: errorMessage,
        timestamp: expect.any(Date),
      });
    });

    it('should handle payment method error', async () => {
      const errorMessage = 'Invalid payment method';
      mockWalletService.fundWallet.mockRejectedValue(new Error(errorMessage));

      const result = await controller.fundWallet('user123', mockFundWalletDto);

      expect(result).toEqual({
        success: false,
        message: 'Failed to fund wallet',
        error: errorMessage,
        timestamp: expect.any(Date),
      });
    });

    it('should handle payment processing error', async () => {
      const errorMessage = 'Payment processing failed';
      mockWalletService.fundWallet.mockRejectedValue(new Error(errorMessage));

      const result = await controller.fundWallet('user123', mockFundWalletDto);

      expect(result).toEqual({
        success: false,
        message: 'Failed to fund wallet',
        error: errorMessage,
        timestamp: expect.any(Date),
      });
    });

    it('should handle duplicate payment reference error', async () => {
      const errorMessage = 'Payment reference already exists';
      mockWalletService.fundWallet.mockRejectedValue(new Error(errorMessage));

      const result = await controller.fundWallet('user123', mockFundWalletDto);

      expect(result).toEqual({
        success: false,
        message: 'Failed to fund wallet',
        error: errorMessage,
        timestamp: expect.any(Date),
      });
    });

    it('should handle user not found error', async () => {
      const errorMessage = 'User not found';
      mockWalletService.fundWallet.mockRejectedValue(new Error(errorMessage));
      const result = await controller.fundWallet('user123', mockFundWalletDto);
      expect(result).toEqual({
        success: false,
        message: 'Failed to fund wallet',
        error: errorMessage,
        timestamp: expect.any(Date),
      });
    });
  });

  describe('getBalance', () => {
    it('should successfully retrieve wallet balance', async () => {
      const mockBalance = 1250.5;
      mockWalletService.getBalance.mockResolvedValue(mockBalance);

      const result = await controller.getBalance('user123');

      expect(result).toEqual({
        success: true,
        message: 'Balance retrieved successfully',
        data: { balance: mockBalance },
        timestamp: expect.any(Date),
      });
      expect(mockWalletService.getBalance).toHaveBeenCalledWith('user123');
      expect(mockWalletService.getBalance).toHaveBeenCalledTimes(1);
    });

    it('should handle zero balance', async () => {
      const mockBalance = 0;
      mockWalletService.getBalance.mockResolvedValue(mockBalance);

      const result = await controller.getBalance('user456');

      expect(result).toEqual({
        success: true,
        message: 'Balance retrieved successfully',
        data: { balance: mockBalance },
        timestamp: expect.any(Date),
      });
      expect(mockWalletService.getBalance).toHaveBeenCalledWith('user456');
    });

    it('should handle wallet not found error', async () => {
      const errorMessage = 'Wallet not found';
      mockWalletService.getBalance.mockRejectedValue(new Error(errorMessage));

      const result = await controller.getBalance('nonexistent');

      expect(result).toEqual({
        success: false,
        message: 'Failed to retrieve balance',
        error: errorMessage,
        timestamp: expect.any(Date),
      });
      expect(mockWalletService.getBalance).toHaveBeenCalledWith('nonexistent');
    });

    it('should handle invalid user ID format', async () => {
      const errorMessage = 'Invalid user ID format';
      mockWalletService.getBalance.mockRejectedValue(new Error(errorMessage));

      const result = await controller.getBalance('invalid-user-id');

      expect(result).toEqual({
        success: false,
        message: 'Failed to retrieve balance',
        error: errorMessage,
        timestamp: expect.any(Date),
      });
    });

    it('should handle database connection error', async () => {
      const errorMessage = 'Database connection failed';
      mockWalletService.getBalance.mockRejectedValue(new Error(errorMessage));

      const result = await controller.getBalance('user123');

      expect(result).toEqual({
        success: false,
        message: 'Failed to retrieve balance',
        error: errorMessage,
        timestamp: expect.any(Date),
      });
    });

    it('should handle service timeout error', async () => {
      const errorMessage = 'Service timeout';
      mockWalletService.getBalance.mockRejectedValue(new Error(errorMessage));

      const result = await controller.getBalance('user123');

      expect(result).toEqual({
        success: false,
        message: 'Failed to retrieve balance',
        error: errorMessage,
        timestamp: expect.any(Date),
      });
    });
  });
});
