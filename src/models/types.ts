import { TransactionStatus, TransactionType } from './enums';

export interface Transaction {
  id: string;
  merchantId: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  createdAt: Date;
  originalTransactionId?: string;
}

export interface DailySettlement {
  merchantId: string;
  grossAmount: number;
  totalFees: number;
  totalRefunds: number;
  totalChargebacks: number;
  totalPenalties: number;
  netAmount: number;
  riskLevel: string;
}
