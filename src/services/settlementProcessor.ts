import { Transaction, DailySettlement, TransactionStatus, TransactionType } from '../models';
import { roundToTwoDecimals } from '../domain/validations';
import { calculateChargebackRatio, determineRiskLevel } from './riskManager';

export interface MerchantAggregation {
  merchantId: string;
  grossAmount: number;
  totalFees: number;
  totalRefunds: number;
  totalChargebacks: number;
  totalPenalties: number;
  chargebackCount: number;
  approvedPaymentCount: number;
}

export function groupTransactionsByMerchant(
  transactions: Transaction[],
  paymentFees: Map<string, number>,
  chargebackPenalties: Map<string, number>
): Map<string, MerchantAggregation> {
  const aggregationMap = new Map<string, MerchantAggregation>();

  for (const transaction of transactions) {
    let aggregation = aggregationMap.get(transaction.merchantId);

    if (!aggregation) {
      aggregation = {
        merchantId: transaction.merchantId,
        grossAmount: 0,
        totalFees: 0,
        totalRefunds: 0,
        totalChargebacks: 0,
        totalPenalties: 0,
        chargebackCount: 0,
        approvedPaymentCount: 0
      };
      aggregationMap.set(transaction.merchantId, aggregation);
    }

    if (transaction.type === TransactionType.PAYMENT && transaction.status === TransactionStatus.APPROVED) {
      aggregation.grossAmount += transaction.amount;
      aggregation.approvedPaymentCount += 1;

      const fee = paymentFees.get(transaction.id) || 0;
      aggregation.totalFees += fee;
    }

    if (transaction.type === TransactionType.REFUND) {
      aggregation.totalRefunds += transaction.amount;

      const feeReturned = paymentFees.get(transaction.id) || 0;
      aggregation.totalFees -= feeReturned;
    }

    if (transaction.type === TransactionType.CHARGEBACK) {
      aggregation.totalChargebacks += transaction.amount;
      aggregation.chargebackCount += 1;

      const penalty = chargebackPenalties.get(transaction.id) || 0;
      aggregation.totalPenalties += penalty;
    }

    if (transaction.type === TransactionType.CHARGEBACK_REVERSED) {
      aggregation.totalChargebacks -= transaction.amount;
      aggregation.chargebackCount = Math.max(0, aggregation.chargebackCount - 1);

      const penaltyReversed = chargebackPenalties.get(transaction.id) || 0;
      aggregation.totalPenalties -= penaltyReversed;
    }
  }

  aggregationMap.forEach(agg => {
    agg.grossAmount = roundToTwoDecimals(agg.grossAmount);
    agg.totalFees = roundToTwoDecimals(agg.totalFees);
    agg.totalRefunds = roundToTwoDecimals(agg.totalRefunds);
    agg.totalChargebacks = roundToTwoDecimals(agg.totalChargebacks);
    agg.totalPenalties = roundToTwoDecimals(agg.totalPenalties);
  });

  return aggregationMap;
}

export function calculateNetAmount(aggregation: MerchantAggregation): number {
  const netAmount =
    aggregation.grossAmount -
    aggregation.totalFees -
    aggregation.totalRefunds -
    aggregation.totalChargebacks -
    aggregation.totalPenalties;

  return roundToTwoDecimals(netAmount);
}

export function generateDailySettlement(
  aggregation: MerchantAggregation
): DailySettlement {
  const netAmount = calculateNetAmount(aggregation);

  const chargebackRatio = calculateChargebackRatio(
    aggregation.chargebackCount,
    aggregation.approvedPaymentCount
  );
  const riskLevel = determineRiskLevel(chargebackRatio);

  return {
    merchantId: aggregation.merchantId,
    grossAmount: aggregation.grossAmount,
    totalFees: aggregation.totalFees,
    totalRefunds: aggregation.totalRefunds,
    totalChargebacks: aggregation.totalChargebacks,
    totalPenalties: aggregation.totalPenalties,
    netAmount,
    riskLevel: riskLevel
  };
}

export function generateDailySettlements(
  transactions: Transaction[],
  paymentFees: Map<string, number>,
  chargebackPenalties: Map<string, number>
): DailySettlement[] {
  const aggregations = groupTransactionsByMerchant(
    transactions,
    paymentFees,
    chargebackPenalties
  );

  const settlements: DailySettlement[] = [];

  aggregations.forEach(aggregation => {
    const settlement = generateDailySettlement(aggregation);
    settlements.push(settlement);
  });

  return settlements;
}
