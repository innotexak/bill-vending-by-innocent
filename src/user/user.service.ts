import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Model } from 'mongoose';
import { LoginDto } from './dto/login.dto';
import {
  AccountNotActivatedException,
  UserAlreadyExistException,
  UserNotFoundException,
} from '@/common/exceptions';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { LoginResponse } from '@/common/interfaces/base-response.interface';
import { WalletService } from '@/wallet/wallet.service';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly walletService: WalletService,
  ) {}

  async Login(payload: LoginDto): Promise<LoginResponse> {
    try {
      // Check if there is user with the email
      const isUser = await this.userModel.findOne({ email: payload.email });
      if (!isUser) throw new UserNotFoundException();

      if (!isUser.activatedAt) throw new AccountNotActivatedException();

      // Compare password using bcrypt
      const isPasswordValid = await bcrypt.compare(
        payload.password,
        isUser.password,
      );
      if (!isPasswordValid) throw new UserNotFoundException();

      isUser.lastLogin = new Date();
      await isUser.save();

      // Generate JWT token
      const token = await this.generateToken({
        userId: isUser._id.toString(),
        email: isUser.email,
        role: isUser.role || 'user',
      });

      return {
        token,
        user: {
          id: isUser._id.toString(),
          email: isUser.email,
          role: isUser.role,
        },
      };
    } catch (error) {
      this.logger.error(
        `Login attempted failed for user ${payload.email}: ${error.message}`,
      );
    }
  }

  async Register(payload: LoginDto) {
    // Check if there is user with the email
    const isUser = await this.userModel.findOne({ email: payload.email });
    if (isUser) throw new UserAlreadyExistException();

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(payload.password, 12);

    const create = new this.userModel({
      ...payload,
      password: hashedPassword,
      activatedAt: new Date(),
    });
    await create.save();

    //Create user wallet once the registration is completed
    await this.walletService.fundWallet({ amount: 0.5 }, create._id as string);

    // Destructure to exclude password
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, deleted, ...userWithoutPassword } = create.toObject();
    return userWithoutPassword;
  }

  async getProfile(userId: string): Promise<User> {
    const profile = await this.userModel
      .findOne({ _id: userId })
      .select({ password: 0 });
    if (!profile) {
      throw new HttpException('User not found', HttpStatus.FOUND);
    }
    return profile;
  }

  /**
   * Generate JWT token
   */
  private async generateToken(payload: {
    userId: string;
    email: string;
    role: string;
  }): Promise<string> {
    const secret = process.env.JWT_SECRET;
    return jwt.sign(
      {
        sub: payload.userId,
        email: payload.email,
        role: payload.role,
      },
      secret,
      { expiresIn: '24h' },
    );
  }
}
