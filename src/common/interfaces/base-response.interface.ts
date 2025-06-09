import { UserRole } from '../enums/user-role.enum';

export interface BaseResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: Date;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
}

export const TOKEN_NAME = 'b_token';
