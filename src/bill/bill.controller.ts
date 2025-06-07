import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BillService } from './bill.service';
import { PayBillDto } from './dto/pay-bill.dto';
import { BaseResponse } from '../common/interfaces/base-response.interface';

@ApiTags('bills')
@Controller('bills')
export class BillController {
  constructor(private readonly billService: BillService) {}

  @Post('pay')
  @ApiOperation({ summary: 'Pay bill' })
  @ApiResponse({
    status: 201,
    description: 'Bill payment initiated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request or insufficient funds',
  })
  async payBill(@Body() payBillDto: PayBillDto): Promise<BaseResponse> {
    try {
      const result = await this.billService.payBill(payBillDto);
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
