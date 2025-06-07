import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckBalanceDto {
  @ApiProperty({ description: 'User ID', example: 'user123' })
  @IsString()
  userId: string;
}
