import { HttpException, HttpStatus } from '@nestjs/common';

export class TransactionNotFoundException extends HttpException {
  constructor(transactionId: string) {
    super(`Transaction ${transactionId} not found`, HttpStatus.NOT_FOUND);
  }
}

export class WalletNotFoundException extends HttpException {
  constructor(userId: string) {
    super(`Wallet not found for user ${userId}`, HttpStatus.NOT_FOUND);
  }
}

export class InsufficientFundsException extends HttpException {
  constructor() {
    super('Insufficient funds in wallet', HttpStatus.BAD_REQUEST);
  }
}
