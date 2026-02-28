import { Transaction, TransactionStatus } from '../models';
import {
  roundToTwoDecimals,
  DEFAULT_PAYMENT_FEE_RATE,
  HIGH_VOLUME_PAYMENT_FEE_RATE,
  HIGH_VOLUME_THRESHOLD
} from '../domain/constants';

export interface ProcessedPayment {
  transactionId: string;
  amount: number;
  fee: number;
  netAmount: number;
}

export function calculateFeeRate(totalVolume: number): number {
  if (totalVolume > HIGH_VOLUME_THRESHOLD) {
    return HIGH_VOLUME_PAYMENT_FEE_RATE;
  }
  return DEFAULT_PAYMENT_FEE_RATE;
}

export function calculatePaymentFee(amount: number, feeRate: number): number {
  const fee = amount * feeRate;
  return roundToTwoDecimals(fee);
}

export function calculatePaymentNetAmount(amount: number, fee: number): number {
  const netAmount = amount - fee;
  return roundToTwoDecimals(netAmount);
}

export function processApprovedPayment(
  transaction: Transaction,
  totalApprovedPaymentsVolume: number
): ProcessedPayment {
  if (transaction.status !== TransactionStatus.APPROVED) {
    throw new Error(`Cannot process non-approved payment with status: ${transaction.status}`);
  }

  const feeRate = calculateFeeRate(totalApprovedPaymentsVolume);

  const fee = calculatePaymentFee(transaction.amount, feeRate);

  const netAmount = calculatePaymentNetAmount(transaction.amount, fee);

  return {
    transactionId: transaction.id,
    amount: transaction.amount,
    fee,
    netAmount
  };
}
