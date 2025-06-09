import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FundWalletDto {
  @ApiProperty({ description: 'Amount to fund', example: 100.5, minimum: 0.01 })
  @IsNumber()
  @Min(0.01)
  amount: number;
}
