import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ description: 'User email', example: 'innocent@mail.com' })
  @IsString()
  email: string;

  @ApiProperty({ description: 'User password', example: '1234567' })
  @IsString()
  password: string;

  @ApiProperty({
    description: 'User lastName',
    example: 'Innocent',
    required: false,
  })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({
    description: 'User firstName',
    example: 'Akuh',
    required: false,
  })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({
    description: 'User phone number',
    example: '08012345678',
    required: false,
  })
  @IsString()
  @IsOptional()
  phone?: string;
}
