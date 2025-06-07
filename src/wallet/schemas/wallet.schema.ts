import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type WalletDocument = Wallet & Document;

@Schema({ timestamps: true })
export class Wallet {
  @Prop({ required: true, unique: true })
  userId: string;

  @Prop({ required: true, default: 0, min: 0 })
  balance: number;

  @Prop({ required: true, default: 0 })
  version: number;
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);

// Add optimistic locking
WalletSchema.pre('save', function (next) {
  if (this.isModified('balance')) {
    this.version += 1;
  }
  next();
});
