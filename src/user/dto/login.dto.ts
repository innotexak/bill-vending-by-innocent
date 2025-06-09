import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ description: 'User email', example: 'innocent@mail.com' })
  @IsString()
  email: string;

  @ApiProperty({ description: 'User password', example: '1234567' })
  @IsString()
  password: string;
}
