import { Transaction } from '../models';
import { CHARGEBACK_FIXED_PENALTY } from '../domain/constants';
import { roundToTwoDecimals } from '../domain/validations';

export interface ProcessedChargeback {
  chargebackTransactionId: string;
  originalPaymentId: string;
  chargebackAmount: number;
  penalty: number;
  totalDeduction: number;
}

export interface ProcessedChargebackReversed {
  chargebackReversedTransactionId: string;
  originalChargebackId: string;
  chargebackAmountReversed: number;
  penaltyRemoved: number;
  totalReversed: number;
}

export function processChargeback(
  chargebackTransaction: Transaction,
  originalPayment: Transaction
): ProcessedChargeback {
  const chargebackAmount = roundToTwoDecimals(originalPayment.amount);

  const penalty = roundToTwoDecimals(CHARGEBACK_FIXED_PENALTY);

  const totalDeduction = roundToTwoDecimals(chargebackAmount + penalty);

  return {
    chargebackTransactionId: chargebackTransaction.id,
    originalPaymentId: originalPayment.id,
    chargebackAmount,
    penalty,
    totalDeduction
  };
}

export function processChargebackReversed(
  chargebackReversedTransaction: Transaction,
  originalChargebackAmount: number,
  originalChargebackPenalty: number
): ProcessedChargebackReversed {
  const chargebackAmountReversed = roundToTwoDecimals(originalChargebackAmount);
  const penaltyRemoved = roundToTwoDecimals(originalChargebackPenalty);
  const totalReversed = roundToTwoDecimals(chargebackAmountReversed + penaltyRemoved);

  return {
    chargebackReversedTransactionId: chargebackReversedTransaction.id,
    originalChargebackId: chargebackReversedTransaction.originalTransactionId || '',
    chargebackAmountReversed,
    penaltyRemoved,
    totalReversed
  };
}
