import { Transaction, DailySettlement, TransactionType, TransactionStatus } from './models';
import { validateTransaction } from './domain/validations';
import {
  processApprovedPayment
} from './services/paymentProcessor';
import { processRefund } from './services/refundProcessor';
import {
  processChargeback,
  processChargebackReversed
} from './services/chargebackProcessor';
import {
  calculateChargebackRatio,
  calculateHighChargebackRatioPenalty
} from './services/riskManager';
import {
  calculateVolumeByMerchant
} from './services/volumeCalculator';
import {
  groupTransactionsByMerchant,
  generateDailySettlement,
  MerchantAggregation
} from './services/settlementProcessor';

export class DailySettlementProcessor {
  public process(transactions: Transaction[]): DailySettlement[] {
    const validatedTransactions = this.validateTransactions(transactions);

    const volumeByMerchant = calculateVolumeByMerchant(validatedTransactions);

    const paymentMap = new Map<string, Transaction>();
    const paymentFees = new Map<string, number>();
    const chargebackPenalties = new Map<string, number>();
    const merchantChargebackCounts = new Map<string, number>();
    const merchantApprovedPaymentCounts = new Map<string, number>();
    for (const transaction of validatedTransactions) {
      if (transaction.type === TransactionType.PAYMENT) {
        paymentMap.set(transaction.id, transaction);

        if (transaction.status === TransactionStatus.APPROVED) {
          const volume = volumeByMerchant.get(transaction.merchantId);
          const merchantVolume = volume?.totalApprovedPaymentsVolume || 0;

          const processed = processApprovedPayment(transaction, merchantVolume);
          paymentFees.set(transaction.id, processed.fee);

          const count = merchantApprovedPaymentCounts.get(transaction.merchantId) || 0;
          merchantApprovedPaymentCounts.set(transaction.merchantId, count + 1);
        }
      }
    }

    for (const transaction of validatedTransactions) {
      if (transaction.type === TransactionType.REFUND && transaction.originalTransactionId) {
        const originalPayment = paymentMap.get(transaction.originalTransactionId);
        if (originalPayment) {
          const originalFee = paymentFees.get(transaction.originalTransactionId) || 0;
          const processed = processRefund(transaction, originalPayment, originalFee);

          paymentFees.set(transaction.id, processed.feeReturned);
        }
      }
    }

    for (const transaction of validatedTransactions) {
      if (
        transaction.type === TransactionType.CHARGEBACK &&
        transaction.originalTransactionId
      ) {
        const originalPayment = paymentMap.get(transaction.originalTransactionId);
        if (originalPayment) {
          const processed = processChargeback(transaction, originalPayment);
          chargebackPenalties.set(transaction.id, processed.penalty);

          const count = merchantChargebackCounts.get(transaction.merchantId) || 0;
          merchantChargebackCounts.set(transaction.merchantId, count + 1);
        }
      }

      if (
        transaction.type === TransactionType.CHARGEBACK_REVERSED &&
        transaction.originalTransactionId
      ) {
        const chargebackPenalty = chargebackPenalties.get(
          transaction.originalTransactionId
        ) || 0;

        processChargebackReversed(
          transaction,
          0,
          chargebackPenalty
        );

        chargebackPenalties.set(transaction.id, -chargebackPenalty);

        const count = merchantChargebackCounts.get(transaction.merchantId) || 0;
        merchantChargebackCounts.set(
          transaction.merchantId,
          Math.max(0, count - 1)
        );
      }
    }

    const merchantRiskPenalties = new Map<string, number>();

    for (const [merchantId, approvedPaymentCount] of merchantApprovedPaymentCounts) {
      const chargebackCount = merchantChargebackCounts.get(merchantId) || 0;
      const chargebackRatio = calculateChargebackRatio(
        chargebackCount,
        approvedPaymentCount
      );

      const ratioPenalty = calculateHighChargebackRatioPenalty(chargebackRatio);
      if (ratioPenalty > 0) {
        merchantRiskPenalties.set(merchantId, ratioPenalty);
      }
    }

    const aggregations = groupTransactionsByMerchant(
      validatedTransactions,
      paymentFees,
      chargebackPenalties
    );

    aggregations.forEach((agg: MerchantAggregation, merchantId: string) => {
      const ratioPenalty = merchantRiskPenalties.get(merchantId) || 0;
      agg.totalPenalties += ratioPenalty;
    });

    const settlements: DailySettlement[] = [];
    aggregations.forEach(aggregation => {
      const settlement = generateDailySettlement(aggregation);
      settlements.push(settlement);
    });

    settlements.sort((a, b) => a.merchantId.localeCompare(b.merchantId));

    return settlements;
  }

  private validateTransactions(transactions: Transaction[]): Transaction[] {
    const paymentMap = new Map<string, Transaction>();
    const allTransactionsMap = new Map<string, Transaction>();

    for (const transaction of transactions) {
      if (transaction.type === TransactionType.PAYMENT) {
        paymentMap.set(transaction.id, transaction);
      }
      allTransactionsMap.set(transaction.id, transaction);
    }

    for (const transaction of transactions) {
      validateTransaction(transaction, paymentMap, allTransactionsMap);
    }

    return transactions;
  }
}
