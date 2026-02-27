export enum TransactionStatus {
  APPROVED = 'approved',
  PENDING = 'pending',
  FAILED = 'failed'
}

export enum TransactionType {
  PAYMENT = 'payment',
  REFUND = 'refund',
  CHARGEBACK = 'chargeback',
  CHARGEBACK_REVERSED = 'chargebackReversed'
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}
