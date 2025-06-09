import { IsString, IsNumber, Min, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PayBillDto {
  @ApiProperty({ description: 'Bill type', example: 'electricity' })
  @IsString()
  billType: string;

  @ApiProperty({ description: 'Account number', example: '1234567890' })
  @IsString()
  accountNumber: string;

  @ApiProperty({ description: 'Amount to pay', example: 50.0, minimum: 0.01 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({
    description: 'Meter number (optional)',
    example: 'MTR123456',
    required: false,
  })
  @IsOptional()
  @IsString()
  meterNumber?: string;
}
