import { Transaction, TransactionStatus, TransactionType } from '../models';

export function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function validateAmountNotNegative(amount: number): void {
  if (amount < 0) {
    throw new ValidationError('Transaction amount cannot be negative');
  }
}

export function validateDate(date: Date): void {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new ValidationError('Invalid date format');
  }
}

export function validateRefundHasValidPayment(
  refund: Transaction,
  payments: Map<string, Transaction>
): void {
  if (!refund.originalTransactionId) {
    throw new ValidationError('Refund must have an originalTransactionId');
  }

  const originalTransaction = payments.get(refund.originalTransactionId);

  if (!originalTransaction) {
    throw new ValidationError(
      `Refund references non-existent payment: ${refund.originalTransactionId}`
    );
  }

  if (originalTransaction.type !== TransactionType.PAYMENT) {
    throw new ValidationError(
      `Refund must reference a payment, not ${originalTransaction.type}`
    );
  }
}

export function validateChargebackHasValidApprovedPayment(
  chargeback: Transaction,
  payments: Map<string, Transaction>
): void {
  if (!chargeback.originalTransactionId) {
    throw new ValidationError('Chargeback must have an originalTransactionId');
  }

  const originalTransaction = payments.get(chargeback.originalTransactionId);

  if (!originalTransaction) {
    throw new ValidationError(
      `Chargeback references non-existent payment: ${chargeback.originalTransactionId}`
    );
  }

  if (originalTransaction.type !== TransactionType.PAYMENT) {
    throw new ValidationError(
      `Chargeback must reference a payment, not ${originalTransaction.type}`
    );
  }

  if (originalTransaction.status !== TransactionStatus.APPROVED) {
    throw new ValidationError(
      `Chargeback must reference an approved payment, got: ${originalTransaction.status}`
    );
  }
}

export function validateChargebackReversedHasValidChargeback(
  chargebackReversed: Transaction,
  allTransactions: Map<string, Transaction>
): void {
  if (!chargebackReversed.originalTransactionId) {
    throw new ValidationError('ChargebackReversed must have an originalTransactionId');
  }

  const originalTransaction = allTransactions.get(chargebackReversed.originalTransactionId);

  if (!originalTransaction) {
    throw new ValidationError(
      `ChargebackReversed references non-existent chargeback: ${chargebackReversed.originalTransactionId}`
    );
  }

  if (originalTransaction.type !== TransactionType.CHARGEBACK) {
    throw new ValidationError(
      `ChargebackReversed must reference a chargeback, not ${originalTransaction.type}`
    );
  }
}

export function validateRefundNotExceedsOriginal(
  refundAmount: number,
  originalAmount: number
): void {
  if (refundAmount > originalAmount) {
    throw new ValidationError(
      `Refund amount (${refundAmount}) cannot exceed original payment amount (${originalAmount})`
    );
  }
}

export function validateTransaction(
  transaction: Transaction,
  allPayments?: Map<string, Transaction>,
  allTransactions?: Map<string, Transaction>
): void {
  validateAmountNotNegative(transaction.amount);

  validateDate(transaction.createdAt);

  if (allPayments) {
    if (transaction.type === TransactionType.REFUND) {
      validateRefundHasValidPayment(transaction, allPayments);
    }

    if (transaction.type === TransactionType.CHARGEBACK) {
      validateChargebackHasValidApprovedPayment(transaction, allPayments);
    }
  }

  if (allTransactions && transaction.type === TransactionType.CHARGEBACK_REVERSED) {
    validateChargebackReversedHasValidChargeback(transaction, allTransactions);
  }
}
