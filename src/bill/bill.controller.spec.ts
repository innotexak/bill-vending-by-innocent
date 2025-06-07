import { Test, TestingModule } from '@nestjs/testing';
import { BillController } from './bill.controller';
import { BillService } from './bill.service';
import { PayBillDto } from './dto/pay-bill.dto';
import { TransactionStatus } from '../common/enums/transaction-status.enum';

describe('BillController', () => {
  let controller: BillController;
  let service: BillService;

  const mockBillService = {
    payBill: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BillController],
      providers: [
        {
          provide: BillService,
          useValue: mockBillService,
        },
      ],
    }).compile();

    controller = module.get<BillController>(BillController);
    service = module.get<BillService>(BillService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('payBill', () => {
    const mockPayBillDto: PayBillDto = {
      userId: 'user123',
      billType: 'electricity',
      amount: 100,
      accountNumber: '1234567890',
      meterNumber: 'MTR123456',
    };

    const mockServiceResponse = {
      transactionId: 'txn-uuid-123',
      status: TransactionStatus.PROCESSING,
      message: 'Payment is being processed',
    };

    it('should successfully initiate bill payment', async () => {
      mockBillService.payBill.mockResolvedValue(mockServiceResponse);

      const result = await controller.payBill(mockPayBillDto);

      expect(result).toEqual({
        success: true,
        message: 'Bill payment initiated successfully',
        data: mockServiceResponse,
        timestamp: expect.any(Date),
      });
      expect(mockBillService.payBill).toHaveBeenCalledWith(mockPayBillDto);
      expect(mockBillService.payBill).toHaveBeenCalledTimes(1);
    });

    it('should handle insufficient funds error', async () => {
      const errorMessage = 'Insufficient funds in wallet';
      mockBillService.payBill.mockRejectedValue(new Error(errorMessage));

      const result = await controller.payBill(mockPayBillDto);

      expect(result).toEqual({
        success: false,
        message: 'Failed to initiate bill payment',
        error: errorMessage,
        timestamp: expect.any(Date),
      });
      expect(mockBillService.payBill).toHaveBeenCalledWith(mockPayBillDto);
      expect(mockBillService.payBill).toHaveBeenCalledTimes(1);
    });

    it('should handle invalid account number error', async () => {
      const errorMessage = 'Invalid account number';
      mockBillService.payBill.mockRejectedValue(new Error(errorMessage));

      const result = await controller.payBill(mockPayBillDto);

      expect(result).toEqual({
        success: false,
        message: 'Failed to initiate bill payment',
        error: errorMessage,
        timestamp: expect.any(Date),
      });
      expect(mockBillService.payBill).toHaveBeenCalledWith(mockPayBillDto);
      expect(mockBillService.payBill).toHaveBeenCalledTimes(1);
    });

    it('should handle service unavailable error', async () => {
      const errorMessage = 'Bill payment service unavailable';
      mockBillService.payBill.mockRejectedValue(new Error(errorMessage));

      const result = await controller.payBill(mockPayBillDto);

      expect(result).toEqual({
        success: false,
        message: 'Failed to initiate bill payment',
        error: errorMessage,
        timestamp: expect.any(Date),
      });
      expect(mockBillService.payBill).toHaveBeenCalledWith(mockPayBillDto);
      expect(mockBillService.payBill).toHaveBeenCalledTimes(1);
    });

    it('should handle wallet not found error', async () => {
      const errorMessage = 'Wallet not found for user';
      mockBillService.payBill.mockRejectedValue(new Error(errorMessage));

      const result = await controller.payBill(mockPayBillDto);

      expect(result).toEqual({
        success: false,
        message: 'Failed to initiate bill payment',
        error: errorMessage,
        timestamp: expect.any(Date),
      });
      expect(mockBillService.payBill).toHaveBeenCalledWith(mockPayBillDto);
      expect(mockBillService.payBill).toHaveBeenCalledTimes(1);
    });

    it('should handle validation errors', async () => {
      const errorMessage = 'Validation failed';
      mockBillService.payBill.mockRejectedValue(new Error(errorMessage));

      const result = await controller.payBill(mockPayBillDto);

      expect(result).toEqual({
        success: false,
        message: 'Failed to initiate bill payment',
        error: errorMessage,
        timestamp: expect.any(Date),
      });
      expect(mockBillService.payBill).toHaveBeenCalledWith(mockPayBillDto);
      expect(mockBillService.payBill).toHaveBeenCalledTimes(1);
    });

    it('should handle transaction creation failure', async () => {
      const errorMessage = 'Failed to create transaction';
      mockBillService.payBill.mockRejectedValue(new Error(errorMessage));

      const result = await controller.payBill(mockPayBillDto);

      expect(result).toEqual({
        success: false,
        message: 'Failed to initiate bill payment',
        error: errorMessage,
        timestamp: expect.any(Date),
      });
      expect(mockBillService.payBill).toHaveBeenCalledWith(mockPayBillDto);
      expect(mockBillService.payBill).toHaveBeenCalledTimes(1);
    });

    it('should handle queue service failure', async () => {
      const errorMessage = 'Failed to queue bill payment';
      mockBillService.payBill.mockRejectedValue(new Error(errorMessage));

      const result = await controller.payBill(mockPayBillDto);

      expect(result).toEqual({
        success: false,
        message: 'Failed to initiate bill payment',
        error: errorMessage,
        timestamp: expect.any(Date),
      });
      expect(mockBillService.payBill).toHaveBeenCalledWith(mockPayBillDto);
      expect(mockBillService.payBill).toHaveBeenCalledTimes(1);
    });

    it('should handle payBillDto without optional meterNumber', async () => {
      const payBillDtoWithoutMeter: PayBillDto = {
        userId: 'user123',
        billType: 'water',
        amount: 75.5,
        accountNumber: '9876543210',
      };

      const expectedResponse = {
        transactionId: 'txn-uuid-456',
        status: TransactionStatus.PROCESSING,
        message: 'Payment is being processed',
      };

      mockBillService.payBill.mockResolvedValue(expectedResponse);

      const result = await controller.payBill(payBillDtoWithoutMeter);

      expect(result).toEqual({
        success: true,
        message: 'Bill payment initiated successfully',
        data: expectedResponse,
        timestamp: expect.any(Date),
      });
      expect(mockBillService.payBill).toHaveBeenCalledWith(
        payBillDtoWithoutMeter,
      );
      expect(mockBillService.payBill).toHaveBeenCalledTimes(1);
    });
  });
});
