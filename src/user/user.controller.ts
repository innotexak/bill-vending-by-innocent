import { Body, Controller, Get, Post, Res } from '@nestjs/common';
import { UserService } from './user.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  BaseResponse,
  LoginResponse,
  TOKEN_NAME,
} from '@/common/interfaces/base-response.interface';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UserDecorator } from '@/common/decorator/decorator.getCurrentUser';
import { Response } from 'express';
import { CookieOptions } from 'express-serve-static-core';

const CookiesOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 24 * 60 * 60 * 1000,
  path: '/',
  domain: process.env.DOMAIN ?? '.localhost',
};

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({
    status: 200,
    description: 'User logged in successfully',
  })
  @ApiResponse({ status: 400, description: 'Failed to login' })
  async Login(
    @Body() payload: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<BaseResponse> {
    try {
      const result: LoginResponse = await this.userService.Login(payload);

      // Set token to HTTP-only cookie
      response.cookie(TOKEN_NAME, result.token, CookiesOptions);

      return {
        success: true,
        message: 'Login successfully',
        data: result,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to login',
        error: error.message,
        timestamp: new Date(),
      };
    }
  }

  @Post('register')
  @ApiOperation({ summary: 'Register user' })
  @ApiResponse({
    status: 200,
    description: 'User registered successfully',
  })
  @ApiResponse({ status: 400, description: 'Failed to register user' })
  async Register(@Body() payload: RegisterDto): Promise<BaseResponse> {
    try {
      const user = await this.userService.Register(payload);
      return {
        success: true,
        message: 'Registration successful',
        data: user,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to register',
        error: error.message,
        timestamp: new Date(),
      };
    }
  }

  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retrieve current login user profile' })
  @ApiResponse({ status: 200, description: 'Profile etrieved successfully' })
  @ApiResponse({ status: 404, description: 'User information not found' })
  async getProfile(
    @UserDecorator('userId') userId: string,
  ): Promise<BaseResponse> {
    try {
      const balance = await this.userService.getProfile(userId);
      return {
        success: true,
        message: 'Profile retrieved successfully',
        data: { balance },
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve profile',
        error: error.message,
        timestamp: new Date(),
      };
    }
  }
  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({
    status: 200,
    description: 'User logged out successfully',
  })
  @ApiResponse({ status: 400, description: 'Failed to logout' })
  async Logout(
    @Res({ passthrough: true }) response: Response,
  ): Promise<BaseResponse> {
    try {
      // Clear the HTTP-only cookie by setting it with an expired date
      response.clearCookie(TOKEN_NAME, { ...CookiesOptions, maxAge: 0 });

      return {
        success: true,
        message: 'Logout successful',
        data: null,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to logout',
        error: error.message,
        timestamp: new Date(),
      };
    }
  }
}
