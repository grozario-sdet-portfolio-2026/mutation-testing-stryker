import { Transaction } from '../models';
import { REFUND_FULL_WINDOW_DAYS } from '../domain/constants';
import { roundToTwoDecimals } from '../domain/validations';

export interface ProcessedRefund {
  refundTransactionId: string;
  originalPaymentId: string;
  refundAmount: number;
  feeReturned: number;
  totalRefundAmount: number;
  isFullRefund: boolean;
}

export function calculateDaysDifference(
  refundDate: Date,
  paymentDate: Date
): number {
  const timeDifference = refundDate.getTime() - paymentDate.getTime();
  const daysDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
  return daysDifference;
}

export function isWithinFullRefundWindow(
  refundDate: Date,
  paymentDate: Date
): boolean {
  const daysDifference = calculateDaysDifference(refundDate, paymentDate);
  return daysDifference <= REFUND_FULL_WINDOW_DAYS;
}

export function processRefund(
  refundTransaction: Transaction,
  originalPayment: Transaction,
  originalPaymentFee: number
): ProcessedRefund {
  if (refundTransaction.amount > originalPayment.amount) {
    throw new Error(
      `Refund amount (${refundTransaction.amount}) cannot exceed original payment amount (${originalPayment.amount})`
    );
  }

  const isFullWindow = isWithinFullRefundWindow(
    refundTransaction.createdAt,
    originalPayment.createdAt
  );

  let feeReturned = 0;

  if (isFullWindow) {
    feeReturned = roundToTwoDecimals(originalPaymentFee);
  }

  const totalRefundAmount = roundToTwoDecimals(refundTransaction.amount + feeReturned);

  return {
    refundTransactionId: refundTransaction.id,
    originalPaymentId: originalPayment.id,
    refundAmount: roundToTwoDecimals(refundTransaction.amount),
    feeReturned,
    totalRefundAmount,
    isFullRefund: isFullWindow
  };
}
