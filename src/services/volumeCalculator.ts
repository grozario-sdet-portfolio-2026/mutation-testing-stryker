import { Transaction, TransactionStatus, TransactionType } from '../models';

export interface VolumeMetrics {
  totalApprovedPaymentsVolume: number;
  totalApprovedPaymentsCount: number;
}

export function calculateApprovedPaymentsVolume(
  transactions: Transaction[]
): VolumeMetrics {
  let totalVolume = 0;
  let count = 0;

  for (const transaction of transactions) {
    if (
      transaction.type === TransactionType.PAYMENT &&
      transaction.status === TransactionStatus.APPROVED
    ) {
      totalVolume += transaction.amount;
      count += 1;
    }
  }

  return {
    totalApprovedPaymentsVolume: totalVolume,
    totalApprovedPaymentsCount: count
  };
}

export function calculateVolumeByMerchant(
  transactions: Transaction[]
): Map<string, VolumeMetrics> {
  const volumeByMerchant = new Map<string, VolumeMetrics>();

  for (const transaction of transactions) {
    if (
      transaction.type === TransactionType.PAYMENT &&
      transaction.status === TransactionStatus.APPROVED
    ) {
      const current = volumeByMerchant.get(transaction.merchantId) || {
        totalApprovedPaymentsVolume: 0,
        totalApprovedPaymentsCount: 0
      };

      current.totalApprovedPaymentsVolume += transaction.amount;
      current.totalApprovedPaymentsCount += 1;

      volumeByMerchant.set(transaction.merchantId, current);
    }
  }

  return volumeByMerchant;
}
