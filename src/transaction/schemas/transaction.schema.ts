import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { TransactionStatus } from '../../common/enums/transaction-status.enum';
import { TransactionType } from '../../common/enums/transaction-type.enum';

export type TransactionDocument = Transaction & Document;

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ required: true, unique: true })
  transactionId: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true, enum: TransactionType })
  type: TransactionType;

  @Prop({
    required: true,
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @Prop({
    type: {
      billType: { type: String, required: true },
      accountNumber: { type: String, required: true },
      meterNumber: { type: String, required: false },
    },
    required: false,
  })
  billDetails?: {
    billType: string;
    accountNumber: string;
    meterNumber?: string;
  };

  @Prop()
  externalTransactionId?: string;

  @Prop()
  failureReason?: string;

  @Prop()
  reversalTransactionId?: string;

  @Prop({ type: Object })
  metadata?: Record<string, any>;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);