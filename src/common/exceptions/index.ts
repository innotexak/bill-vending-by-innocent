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

export class UserNotFoundException extends HttpException {
  constructor() {
    super('Invalid login credential', HttpStatus.BAD_REQUEST);
  }
}

export class UserAlreadyExistException extends HttpException {
  constructor() {
    super('User already exist', HttpStatus.BAD_REQUEST);
  }
}

export class AccountNotActivatedException extends HttpException {
  constructor() {
    super('Kindly activate your account', HttpStatus.FORBIDDEN);
  }
}
