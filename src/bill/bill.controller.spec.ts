import { mockUserDecorator } from '../common/decorator/mock/mock.getCurrentUser';
mockUserDecorator();

import { Test, TestingModule } from '@nestjs/testing';
import { BillController } from './bill.controller';
import { BillService } from './bill.service';
import { PayBillDto } from './dto/pay-bill.dto';

describe('BillController', () => {
  let controller: BillController;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      accountNumber: '1234567890',
      amount: 100,
      billType: 'electricity',
      meterNumber: 'MTR123456',
    };

    const userId = 'user123';

    it('should handle transaction creation failure', async () => {
      const error = new Error('Transaction creation failed');
      mockBillService.payBill.mockRejectedValue(error);

      const result = await controller.payBill(userId, mockPayBillDto);

      expect(result).toEqual({
        success: false,
        message: 'Failed to initiate bill payment',
        error: 'Transaction creation failed',
        timestamp: expect.any(Date),
      });
      // Fix: Include userId as the second parameter
      expect(mockBillService.payBill).toHaveBeenCalledWith(
        mockPayBillDto,
        userId,
      );
      expect(mockBillService.payBill).toHaveBeenCalledTimes(1);
    });

    it('should handle queue service failure', async () => {
      const error = new Error('Queue service unavailable');
      mockBillService.payBill.mockRejectedValue(error);

      const result = await controller.payBill(userId, mockPayBillDto);

      expect(result).toEqual({
        success: false,
        message: 'Failed to initiate bill payment',
        error: 'Queue service unavailable',
        timestamp: expect.any(Date),
      });
      // Fix: Include userId as the second parameter
      expect(mockBillService.payBill).toHaveBeenCalledWith(
        mockPayBillDto,
        userId,
      );
      expect(mockBillService.payBill).toHaveBeenCalledTimes(1);
    });

    it('should handle payBillDto without optional meterNumber', async () => {
      const payBillDtoWithoutMeter = {
        accountNumber: '9876543210',
        amount: 75.5,
        billType: 'water',
      };

      const mockResult = {
        transactionId: 'txn789',
        status: 'pending',
        amount: 75.5,
      };

      mockBillService.payBill.mockResolvedValue(mockResult);

      const result = await controller.payBill(userId, payBillDtoWithoutMeter);

      expect(result).toEqual({
        success: true,
        message: 'Bill payment initiated successfully',
        data: mockResult,
        timestamp: expect.any(Date),
      });
      // Fix: Include userId as the second parameter
      expect(mockBillService.payBill).toHaveBeenCalledWith(
        payBillDtoWithoutMeter,
        userId,
      );
      expect(mockBillService.payBill).toHaveBeenCalledTimes(1);
    });
  });
});
