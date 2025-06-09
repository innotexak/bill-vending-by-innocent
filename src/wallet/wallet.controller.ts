import { Controller, Post, Get, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { FundWalletDto } from './dto/fund-wallet.dto';
import { BaseResponse } from '../common/interfaces/base-response.interface';
import { UserDecorator } from '@/common/decorator/decorator.getCurrentUser';

@ApiTags('wallet')
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post('fund')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Fund user wallet' })
  @ApiResponse({ status: 201, description: 'Wallet funded successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async fundWallet(
    @UserDecorator('userId') userId: string,
    @Body() fundWalletDto: FundWalletDto,
  ): Promise<BaseResponse> {
    try {
      const wallet = await this.walletService.fundWallet(fundWalletDto, userId);
      return {
        success: true,
        message: 'Wallet funded successfully',
        data: wallet,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fund wallet',
        error: error.message,
        timestamp: new Date(),
      };
    }
  }

  @Get('balance')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check wallet balance' })
  @ApiResponse({ status: 200, description: 'Balance retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  async getBalance(
    @UserDecorator('userId') userId: string,
  ): Promise<BaseResponse> {
    try {
      const balance = await this.walletService.getBalance(userId);
      return {
        success: true,
        message: 'Balance retrieved successfully',
        data: { balance },
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve balance',
        error: error.message,
        timestamp: new Date(),
      };
    }
  }
}
