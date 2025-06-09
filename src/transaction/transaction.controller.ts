import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TransactionService } from './transaction.service';
import { BaseResponse } from '../common/interfaces/base-response.interface';
import { UserDecorator } from '../common/decorator/decorator.getCurrentUser';

@ApiTags('transactions')
@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get(':transactionId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get transaction by ID' })
  @ApiResponse({
    status: 200,
    description: 'Transaction retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async getTransaction(
    @UserDecorator('userId') userId: string,
    @Param('transactionId') transactionId: string,
  ): Promise<BaseResponse> {
    try {
      const transaction =
        await this.transactionService.getTransaction(transactionId);
      return {
        success: true,
        message: 'Transaction retrieved successfully',
        data: transaction,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve transaction',
        error: error.message,
        timestamp: new Date(),
      };
    }
  }

  @Get('user')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user transactions' })
  @ApiResponse({
    status: 200,
    description: 'Transactions retrieved successfully',
  })
  async getUserTransactions(
    @UserDecorator('userId') userId: string,
  ): Promise<BaseResponse> {
    try {
      const transactions =
        await this.transactionService.getUserTransactions(userId);
      return {
        success: true,
        message: 'Transactions retrieved successfully',
        data: transactions,
        timestamp: new Date(),
      };
    } catch (error) {
      console.log(error);
      return {
        success: false,
        message: 'Failed to retrieve transactions',
        error: error.message,
        timestamp: new Date(),
      };
    }
  }
}
