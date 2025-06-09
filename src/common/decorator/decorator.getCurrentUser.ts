import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { TOKEN_NAME } from '../interfaces/base-response.interface';

export interface UserPayload {
  userId: string;
  email: string;
  role: string;
  sub: string;
  iat?: number;
  exp?: number;
}

export const UserDecorator = createParamDecorator(
  (
    data: keyof UserPayload | undefined,
    ctx: ExecutionContext,
  ): UserPayload | string | number => {
    const request = ctx.switchToHttp().getRequest();

    // Try to get token from Authorization header first
    let token = null;
    const authHeader = request.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7); // Remove 'Bearer ' prefix
    } else if (request.cookies && request.cookies[TOKEN_NAME]) {
      // Fallback to cookie if no Authorization header
      token = request.cookies[TOKEN_NAME];
    }

    if (!token) {
      throw new UnauthorizedException('No authentication token found');
    }

    try {
      const secret = process.env.JWT_SECRET || 'your-secret-key';
      const decoded = jwt.verify(token, secret) as any;

      const userPayload: UserPayload = {
        userId: decoded.sub || decoded.userId,
        email: decoded.email,
        role: decoded.role,
        sub: decoded.sub,
        iat: decoded.iat,
        exp: decoded.exp,
      };

      // If specific property is requested, return only that property
      if (data) {
        return userPayload[data];
      }

      // Return full payload
      return userPayload;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token has expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid token');
      }
      throw new UnauthorizedException('Token verification failed');
    }
  },
);
