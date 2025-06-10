import { UserRole } from '../../common/enums/user-role.enum';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, index: true })
  email: string;

  @Prop()
  firstName?: string;

  @Prop()
  lastName?: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Prop({ unique: true, index: true })
  phone?: string;

  @Prop({ required: true, default: Date.now() })
  activatedAt: Date;

  @Prop()
  lastLogin: Date;

  @Prop({ default: false })
  deleted: boolean;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    unique: true,
    index: true,
  })
  walletId: MongooseSchema.Types.ObjectId;
}

export const UserSchema = SchemaFactory.createForClass(User);
