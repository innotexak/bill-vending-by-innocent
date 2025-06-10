import { Controller, Post, Body, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BillService } from './bill.service';
import { PayBillDto } from './dto/pay-bill.dto';
import { BaseResponse } from '../common/interfaces/base-response.interface';
import { UserDecorator } from '../common/decorator/decorator.getCurrentUser';

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
  @Get('queue/status')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get bill payment queue status',
    description:
      'Returns the current status of the bill payment queue including waiting, active, completed, and failed jobs',
  })
  @ApiResponse({
    status: 200,
    description: 'Queue status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Queue status retrieved successfully',
        },
        data: {
          type: 'object',
          properties: {
            counts: {
              type: 'object',
              properties: {
                waiting: {
                  type: 'number',
                  example: 1,
                  description: 'Number of jobs waiting',
                },
                active: {
                  type: 'number',
                  example: 0,
                  description: 'Number of active jobs',
                },
                completed: {
                  type: 'number',
                  example: 0,
                  description: 'Number of completed jobs',
                },
                failed: {
                  type: 'number',
                  example: 0,
                  description: 'Number of failed jobs',
                },
                delayed: {
                  type: 'number',
                  example: 0,
                  description: 'Number of delayed jobs',
                },
                total: {
                  type: 'number',
                  example: 1,
                  description: 'Total number of jobs',
                },
              },
            },
            recentJobs: {
              type: 'object',
              properties: {
                active: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      transactionId: { type: 'string', nullable: true },
                      progress: {
                        oneOf: [{ type: 'number' }, { type: 'object' }],
                      },
                      processedOn: {
                        type: 'string',
                        format: 'date-time',
                        nullable: true,
                      },
                    },
                  },
                },
                failed: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      transactionId: { type: 'string', nullable: true },
                      failedReason: { type: 'string', nullable: true },
                      attemptsMade: { type: 'number', nullable: true },
                    },
                  },
                },
              },
            },
            queueHealth: {
              type: 'object',
              properties: {
                isHealthy: { type: 'boolean', example: true },
                processingRate: {
                  type: 'string',
                  example: 'pending',
                  enum: ['processing', 'pending', 'idle'],
                },
              },
            },
          },
        },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getQueueStatus(): Promise<BaseResponse> {
    try {
      const queueStatus = await this.billService.getQueueStatus();

      return {
        success: true,
        message: 'Queue status retrieved successfully',
        data: queueStatus,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve queue status',
        error: error.message,
        timestamp: new Date(),
      };
    }
  }
}
