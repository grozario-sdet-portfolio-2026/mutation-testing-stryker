import { RiskLevel } from '../models';
import {
  CHARGEBACK_RISK_THRESHOLD,
  CHARGEBACK_RATIO_HIGH_THRESHOLD,
  CHARGEBACK_RATIO_MEDIUM_THRESHOLD,
  HIGH_CHARGEBACK_RATIO_PENALTY
} from '../domain/constants';
import { roundToTwoDecimals } from '../domain/constants';

export interface MerchantState {
  merchantId: string;
  chargebackCount: number;
  totalApprovedPayments: number;
  riskLevel: RiskLevel;
}

export function incrementChargebackCount(merchantState: MerchantState): boolean {
  merchantState.chargebackCount += 1;
  return merchantState.chargebackCount >= CHARGEBACK_RISK_THRESHOLD;
}

export function decrementChargebackCount(merchantState: MerchantState): void {
  merchantState.chargebackCount = Math.max(0, merchantState.chargebackCount - 1);
}

export function calculateChargebackRatio(
  chargebackCount: number,
  totalApprovedPayments: number
): number {
  if (totalApprovedPayments === 0) {
    return 0;
  }
  return chargebackCount / totalApprovedPayments;
}

export function determineRiskLevel(chargebackRatio: number): RiskLevel {
  if (chargebackRatio > CHARGEBACK_RATIO_HIGH_THRESHOLD) {
    return RiskLevel.HIGH;
  }
  if (chargebackRatio >= CHARGEBACK_RATIO_MEDIUM_THRESHOLD) {
    return RiskLevel.MEDIUM;
  }
  return RiskLevel.LOW;
}

export function updateMerchantRiskLevel(merchantState: MerchantState): void {
  const chargebackRatio = calculateChargebackRatio(
    merchantState.chargebackCount,
    merchantState.totalApprovedPayments
  );
  merchantState.riskLevel = determineRiskLevel(chargebackRatio);
}

export function calculateHighChargebackRatioPenalty(
  chargebackRatio: number
): number {
  if (chargebackRatio > CHARGEBACK_RATIO_HIGH_THRESHOLD) {
    return roundToTwoDecimals(HIGH_CHARGEBACK_RATIO_PENALTY);
  }
  return 0;
}
