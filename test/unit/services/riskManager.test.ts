import {
  calculateChargebackRatio,
  determineRiskLevel,
  calculateHighChargebackRatioPenalty,
  updateMerchantRiskLevel,
  incrementChargebackCount,
  decrementChargebackCount
} from '../../../src/services/riskManager';
import { RiskLevel } from '../../../src/models';

describe('Risk Manager', () => {
  describe('calculateChargebackRatio', () => {
    it('should return a number', () => {
      const ratio = calculateChargebackRatio(1, 10);
      expect(typeof ratio).toBe('number');
    });

    it('should return 0 for zero approved payments', () => {
      const ratio = calculateChargebackRatio(5, 0);
      expect(ratio).toBe(0);
    });

    it('should return correct ratio for valid inputs', () => {
      const ratio = calculateChargebackRatio(2, 10);
      expect(ratio).toBeGreaterThan(0);
    });

    it('should return ratio less than 1', () => {
      const ratio = calculateChargebackRatio(1, 10);
      expect(ratio).toBeLessThan(1);
    });

    it('should handle large numbers', () => {
      const ratio = calculateChargebackRatio(1000, 100000);
      expect(typeof ratio).toBe('number');
      expect(ratio).toBeGreaterThan(0);
    });

    it('should return 1 for equal chargebacks and payments', () => {
      const ratio = calculateChargebackRatio(10, 10);
      expect(ratio).toBe(1);
    });
  });

  describe('determineRiskLevel', () => {
    it('should return a RiskLevel enum value', () => {
      const level = determineRiskLevel(0.05);
      expect([RiskLevel.LOW, RiskLevel.MEDIUM, RiskLevel.HIGH]).toContain(level);
    });

    it('should return LOW for low ratio', () => {
      const level = determineRiskLevel(0.05);
      expect(level).toBe(RiskLevel.LOW);
    });

    it('should return MEDIUM for medium ratio', () => {
      const level = determineRiskLevel(0.15);
      expect(level).toBe(RiskLevel.MEDIUM);
    });

    it('should return HIGH for high ratio', () => {
      const level = determineRiskLevel(0.3);
      expect(level).toBe(RiskLevel.HIGH);
    });

    it('should handle zero ratio', () => {
      const level = determineRiskLevel(0);
      expect(level).toBe(RiskLevel.LOW);
    });

    it('should handle ratio of 1', () => {
      const level = determineRiskLevel(1);
      expect(level).toBe(RiskLevel.HIGH);
    });

    it('should be consistent for same input', () => {
      const level1 = determineRiskLevel(0.15);
      const level2 = determineRiskLevel(0.15);
      expect(level1).toBe(level2);
    });
  });

  describe('calculateHighChargebackRatioPenalty', () => {
    it('should not throw error', () => {
      expect(() => calculateHighChargebackRatioPenalty(0.25)).not.toThrow();
    });

    it('should return a number', () => {
      const penalty = calculateHighChargebackRatioPenalty(0.25);
      expect(typeof penalty).toBe('number');
    });

    it('should return 0 for low ratio', () => {
      const penalty = calculateHighChargebackRatioPenalty(0.05);
      expect(penalty).toBe(0);
    });

    it('should return positive penalty for high ratio', () => {
      const penalty = calculateHighChargebackRatioPenalty(0.3);
      expect(penalty).toBeGreaterThan(0);
    });

    it('should return 0 for medium ratio', () => {
      const penalty = calculateHighChargebackRatioPenalty(0.15);
      expect(penalty).toBe(0);
    });

    it('should handle extreme ratio', () => {
      const penalty = calculateHighChargebackRatioPenalty(1);
      expect(penalty).toBeGreaterThan(0);
    });

    it('should return same penalty for same ratio', () => {
      const penalty1 = calculateHighChargebackRatioPenalty(0.25);
      const penalty2 = calculateHighChargebackRatioPenalty(0.25);
      expect(penalty1).toBe(penalty2);
    });
  });

  describe('incrementChargebackCount', () => {
    it('should return a boolean', () => {
      const merchantState = {
        merchantId: 'merchant-1',
        chargebackCount: 0,
        totalApprovedPayments: 10,
        riskLevel: RiskLevel.LOW
      };

      const result = incrementChargebackCount(merchantState);
      expect(typeof result).toBe('boolean');
    });

    it('should increase chargebackCount', () => {
      const merchantState = {
        merchantId: 'merchant-1',
        chargebackCount: 0,
        totalApprovedPayments: 10,
        riskLevel: RiskLevel.LOW
      };

      incrementChargebackCount(merchantState);
      expect(merchantState.chargebackCount).toBe(1);
    });

    it('should return false for low count', () => {
      const merchantState = {
        merchantId: 'merchant-1',
        chargebackCount: 0,
        totalApprovedPayments: 10,
        riskLevel: RiskLevel.LOW
      };

      const result = incrementChargebackCount(merchantState);
      expect(result).toBe(false);
    });

    it('should return true when count reaches 3', () => {
      const merchantState = {
        merchantId: 'merchant-1',
        chargebackCount: 2,
        totalApprovedPayments: 10,
        riskLevel: RiskLevel.LOW
      };

      const result = incrementChargebackCount(merchantState);
      expect(result).toBe(true);
    });
  });

  describe('decrementChargebackCount', () => {
    it('should not throw error', () => {
      const merchantState = {
        merchantId: 'merchant-1',
        chargebackCount: 1,
        totalApprovedPayments: 10,
        riskLevel: RiskLevel.LOW
      };

      expect(() => decrementChargebackCount(merchantState)).not.toThrow();
    });

    it('should decrease chargebackCount', () => {
      const merchantState = {
        merchantId: 'merchant-1',
        chargebackCount: 2,
        totalApprovedPayments: 10,
        riskLevel: RiskLevel.LOW
      };

      decrementChargebackCount(merchantState);
      expect(merchantState.chargebackCount).toBe(1);
    });

    it('should not go below zero', () => {
      const merchantState = {
        merchantId: 'merchant-1',
        chargebackCount: 0,
        totalApprovedPayments: 10,
        riskLevel: RiskLevel.LOW
      };

      decrementChargebackCount(merchantState);
      expect(merchantState.chargebackCount).toBeGreaterThanOrEqual(0);
    });

    it('should work with high count', () => {
      const merchantState = {
        merchantId: 'merchant-1',
        chargebackCount: 10,
        totalApprovedPayments: 100,
        riskLevel: RiskLevel.LOW
      };

      decrementChargebackCount(merchantState);
      expect(merchantState.chargebackCount).toBe(9);
    });
  });

  describe('updateMerchantRiskLevel', () => {
    it('should not throw error', () => {
      const merchantState = {
        merchantId: 'merchant-1',
        chargebackCount: 1,
        totalApprovedPayments: 10,
        riskLevel: RiskLevel.LOW
      };

      expect(() => updateMerchantRiskLevel(merchantState)).not.toThrow();
    });

    it('should update riskLevel property', () => {
      const merchantState = {
        merchantId: 'merchant-1',
        chargebackCount: 1,
        totalApprovedPayments: 10,
        riskLevel: RiskLevel.LOW
      };

      updateMerchantRiskLevel(merchantState);
      expect([RiskLevel.LOW, RiskLevel.MEDIUM, RiskLevel.HIGH]).toContain(merchantState.riskLevel);
    });

    it('should set LOW for low ratio', () => {
      const merchantState = {
        merchantId: 'merchant-1',
        chargebackCount: 0,
        totalApprovedPayments: 100,
        riskLevel: RiskLevel.HIGH
      };

      updateMerchantRiskLevel(merchantState);
      expect(merchantState.riskLevel).toBe(RiskLevel.LOW);
    });

    it('should set HIGH for high ratio', () => {
      const merchantState = {
        merchantId: 'merchant-1',
        chargebackCount: 50,
        totalApprovedPayments: 100,
        riskLevel: RiskLevel.LOW
      };

      updateMerchantRiskLevel(merchantState);
      expect(merchantState.riskLevel).toBe(RiskLevel.HIGH);
    });
  });
});
