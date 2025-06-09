import { Controller, Post, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BillService } from './bill.service';
import { PayBillDto } from './dto/pay-bill.dto';
import { BaseResponse } from '../common/interfaces/base-response.interface';
import { UserDecorator } from '@/common/decorator/decorator.getCurrentUser';

@ApiTags('bills')
@Controller('bills')
export class BillController {
  constructor(private readonly billService: BillService) {}

  @Post('pay')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Pay bill' })
  @ApiResponse({
    status: 201,
    description: 'Bill payment initiated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request or insufficient funds',
  })
  async payBill(
    @UserDecorator('userId') userId: string,
    @Body() payBillDto: PayBillDto,
  ): Promise<BaseResponse> {
    try {
      const result = await this.billService.payBill(payBillDto, userId);
      return {
        success: true,
        message: 'Bill payment initiated successfully',
        data: result,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to initiate bill payment',
        error: error.message,
        timestamp: new Date(),
      };
    }
  }
}
