import { Injectable, Logger } from '@nestjs/common';

export interface BillPaymentRequest {
  billType: string;
  accountNumber: string;
  amount: number;
  meterNumber?: string;
  transactionId: string;
}

export interface BillPaymentResponse {
  success: boolean;
  externalTransactionId?: string;
  message: string;
  errorCode?: string;
}

@Injectable()
export class ExternalBillPaymentService {
  private readonly logger = new Logger(ExternalBillPaymentService.name);

  async processPayment(
    request: BillPaymentRequest,
  ): Promise<BillPaymentResponse> {
    this.logger.log(`Processing bill payment: ${JSON.stringify(request)}`);

    // Simulate API delay
    await this.delay(2000);

    // Mock external API responses with 80% success rate
    const isSuccess = Math.random() > 0.2;

    if (isSuccess) {
      return {
        success: true,
        externalTransactionId: `EXT_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        message: 'Payment processed successfully',
      };
    } else {
      const errorCodes = [
        'INVALID_ACCOUNT',
        'SERVICE_UNAVAILABLE',
        'TIMEOUT',
        'INSUFFICIENT_CREDIT',
      ];
      const errorCode =
        errorCodes[Math.floor(Math.random() * errorCodes.length)];

      return {
        success: false,
        message: 'Payment failed',
        errorCode,
      };
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
