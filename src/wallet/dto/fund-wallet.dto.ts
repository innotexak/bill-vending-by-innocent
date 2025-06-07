import { IsNumber, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FundWalletDto {
  @ApiProperty({ description: 'User ID', example: 'user123' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Amount to fund', example: 100.5, minimum: 0.01 })
  @IsNumber()
  @Min(0.01)
  amount: number;
}
