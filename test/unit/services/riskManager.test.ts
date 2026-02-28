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

    // Testes de valores exatos - crítico para detectar mutantes
    it('should return exact ratio 0.1', () => {
      const ratio = calculateChargebackRatio(1, 10);
      expect(ratio).toBe(0.1);
    });

    it('should return exact ratio 0.2', () => {
      const ratio = calculateChargebackRatio(2, 10);
      expect(ratio).toBe(0.2);
    });

    it('should return exact ratio 0.5', () => {
      const ratio = calculateChargebackRatio(5, 10);
      expect(ratio).toBe(0.5);
    });

    it('should return 0 for zero chargebacks', () => {
      const ratio = calculateChargebackRatio(0, 10);
      expect(ratio).toBe(0);
    });

    // Testes parametrizados
    it.each([
      [0, 10, 0],
      [1, 10, 0.1],
      [2, 10, 0.2],
      [3, 10, 0.3],
      [10, 100, 0.1],
      [20, 100, 0.2],
      [50, 100, 0.5],
    ])('should return correct ratio for %d chargebacks and %d payments', (chargebacks, payments, expectedRatio) => {
      expect(calculateChargebackRatio(chargebacks, payments)).toBe(expectedRatio);
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

    // Testes de limites exatos - CRÍTICO
    it('should return LOW for ratio < 0.1', () => {
      const level = determineRiskLevel(0.09);
      expect(level).toBe(RiskLevel.LOW);
    });

    it('should return MEDIUM for ratio exactly 0.1', () => {
      const level = determineRiskLevel(0.1);
      expect(level).toBe(RiskLevel.MEDIUM);
    });

    it('should return MEDIUM for ratio exactly 0.2', () => {
      const level = determineRiskLevel(0.2);
      expect(level).toBe(RiskLevel.MEDIUM);
    });

    it('should return HIGH for ratio > 0.2', () => {
      const level = determineRiskLevel(0.21);
      expect(level).toBe(RiskLevel.HIGH);
    });

    it('should return MEDIUM for ratio between 0.1 and 0.2', () => {
      const level = determineRiskLevel(0.15);
      expect(level).toBe(RiskLevel.MEDIUM);
    });

    it('should return LOW for ratio just below 0.1', () => {
      const level = determineRiskLevel(0.099);
      expect(level).toBe(RiskLevel.LOW);
    });

    it('should return HIGH for ratio just above 0.2', () => {
      const level = determineRiskLevel(0.201);
      expect(level).toBe(RiskLevel.HIGH);
    });

    // Testes parametrizados
    it.each([
      [0, RiskLevel.LOW],
      [0.05, RiskLevel.LOW],
      [0.09, RiskLevel.LOW],
      [0.099, RiskLevel.LOW],
      [0.1, RiskLevel.MEDIUM],
      [0.15, RiskLevel.MEDIUM],
      [0.19, RiskLevel.MEDIUM],
      [0.2, RiskLevel.MEDIUM],
      [0.201, RiskLevel.HIGH],
      [0.21, RiskLevel.HIGH],
      [0.3, RiskLevel.HIGH],
      [0.5, RiskLevel.HIGH],
      [1, RiskLevel.HIGH],
    ])('should return correct risk level for ratio %f', (ratio, expectedLevel) => {
      expect(determineRiskLevel(ratio)).toBe(expectedLevel);
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

    // Testes de valores exatos - crítico
    it('should return 50 for ratio > 0.2', () => {
      const penalty = calculateHighChargebackRatioPenalty(0.3);
      expect(penalty).toBe(50);
    });

    it('should return 0 for ratio exactly 0.2', () => {
      const penalty = calculateHighChargebackRatioPenalty(0.2);
      expect(penalty).toBe(0);
    });

    it('should return 50 for ratio exactly 0.21', () => {
      const penalty = calculateHighChargebackRatioPenalty(0.21);
      expect(penalty).toBe(50);
    });

    it('should return 0 for ratio just below 0.2', () => {
      const penalty = calculateHighChargebackRatioPenalty(0.19);
      expect(penalty).toBe(0);
    });

    it('should return 50 for ratio just above 0.2', () => {
      const penalty = calculateHighChargebackRatioPenalty(0.201);
      expect(penalty).toBe(50);
    });

    it('should return 0 for ratio 0.1', () => {
      const penalty = calculateHighChargebackRatioPenalty(0.1);
      expect(penalty).toBe(0);
    });

    it('should return 0 for zero ratio', () => {
      const penalty = calculateHighChargebackRatioPenalty(0);
      expect(penalty).toBe(0);
    });

    // Testes parametrizados
    it.each([
      [0, 0],
      [0.05, 0],
      [0.1, 0],
      [0.15, 0],
      [0.19, 0],
      [0.2, 0],
      [0.201, 50],
      [0.21, 50],
      [0.3, 50],
      [0.5, 50],
      [1, 50],
    ])('should return correct penalty for ratio %f', (ratio, expectedPenalty) => {
      expect(calculateHighChargebackRatioPenalty(ratio)).toBe(expectedPenalty);
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

    // Testes de limites exatos - CRÍTICO para o threshold de 3
    it('should increment from 0 to 1', () => {
      const merchantState = {
        merchantId: 'merchant-1',
        chargebackCount: 0,
        totalApprovedPayments: 10,
        riskLevel: RiskLevel.LOW
      };

      incrementChargebackCount(merchantState);
      expect(merchantState.chargebackCount).toBe(1);
    });

    it('should increment from 1 to 2', () => {
      const merchantState = {
        merchantId: 'merchant-1',
        chargebackCount: 1,
        totalApprovedPayments: 10,
        riskLevel: RiskLevel.LOW
      };

      incrementChargebackCount(merchantState);
      expect(merchantState.chargebackCount).toBe(2);
    });

    it('should return false when count is 1', () => {
      const merchantState = {
        merchantId: 'merchant-1',
        chargebackCount: 0,
        totalApprovedPayments: 10,
        riskLevel: RiskLevel.LOW
      };

      const result = incrementChargebackCount(merchantState);
      expect(result).toBe(false);
      expect(merchantState.chargebackCount).toBe(1);
    });

    it('should return false when count is 2', () => {
      const merchantState = {
        merchantId: 'merchant-1',
        chargebackCount: 1,
        totalApprovedPayments: 10,
        riskLevel: RiskLevel.LOW
      };

      const result = incrementChargebackCount(merchantState);
      expect(result).toBe(false);
      expect(merchantState.chargebackCount).toBe(2);
    });

    it('should return true when count becomes exactly 3', () => {
      const merchantState = {
        merchantId: 'merchant-1',
        chargebackCount: 2,
        totalApprovedPayments: 10,
        riskLevel: RiskLevel.LOW
      };

      const result = incrementChargebackCount(merchantState);
      expect(result).toBe(true);
      expect(merchantState.chargebackCount).toBe(3);
    });

    it('should return true when count goes beyond 3', () => {
      const merchantState = {
        merchantId: 'merchant-1',
        chargebackCount: 3,
        totalApprovedPayments: 10,
        riskLevel: RiskLevel.LOW
      };

      const result = incrementChargebackCount(merchantState);
      expect(result).toBe(true);
      expect(merchantState.chargebackCount).toBe(4);
    });

    it('should return true for count already at 10', () => {
      const merchantState = {
        merchantId: 'merchant-1',
        chargebackCount: 10,
        totalApprovedPayments: 100,
        riskLevel: RiskLevel.LOW
      };

      const result = incrementChargebackCount(merchantState);
      expect(result).toBe(true);
      expect(merchantState.chargebackCount).toBe(11);
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

    // Testes de limites exatos
    it('should keep chargebackCount at 0 when already 0', () => {
      const merchantState = {
        merchantId: 'merchant-1',
        chargebackCount: 0,
        totalApprovedPayments: 10,
        riskLevel: RiskLevel.LOW
      };

      decrementChargebackCount(merchantState);
      expect(merchantState.chargebackCount).toBe(0);
    });

    it('should decrement from 1 to 0', () => {
      const merchantState = {
        merchantId: 'merchant-1',
        chargebackCount: 1,
        totalApprovedPayments: 10,
        riskLevel: RiskLevel.LOW
      };

      decrementChargebackCount(merchantState);
      expect(merchantState.chargebackCount).toBe(0);
    });

    it('should decrement from 3 to 2', () => {
      const merchantState = {
        merchantId: 'merchant-1',
        chargebackCount: 3,
        totalApprovedPayments: 10,
        riskLevel: RiskLevel.LOW
      };

      decrementChargebackCount(merchantState);
      expect(merchantState.chargebackCount).toBe(2);
    });

    it('should decrement from 4 to 3', () => {
      const merchantState = {
        merchantId: 'merchant-1',
        chargebackCount: 4,
        totalApprovedPayments: 10,
        riskLevel: RiskLevel.LOW
      };

      decrementChargebackCount(merchantState);
      expect(merchantState.chargebackCount).toBe(3);
    });

    // Testes parametrizados
    it.each([
      [0, 0],
      [1, 0],
      [2, 1],
      [3, 2],
      [5, 4],
      [10, 9],
    ])('should decrement from %d to %d', (initial, expected) => {
      const merchantState = {
        merchantId: 'merchant-1',
        chargebackCount: initial,
        totalApprovedPayments: 10,
        riskLevel: RiskLevel.LOW
      };

      decrementChargebackCount(merchantState);
      expect(merchantState.chargebackCount).toBe(expected);
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

    // Testes de limites exatos
    it('should set MEDIUM for ratio exactly 0.1', () => {
      const merchantState = {
        merchantId: 'merchant-1',
        chargebackCount: 10,
        totalApprovedPayments: 100,
        riskLevel: RiskLevel.LOW
      };

      updateMerchantRiskLevel(merchantState);
      expect(merchantState.riskLevel).toBe(RiskLevel.MEDIUM);
    });

    it('should set MEDIUM for ratio exactly 0.2', () => {
      const merchantState = {
        merchantId: 'merchant-1',
        chargebackCount: 20,
        totalApprovedPayments: 100,
        riskLevel: RiskLevel.LOW
      };

      updateMerchantRiskLevel(merchantState);
      expect(merchantState.riskLevel).toBe(RiskLevel.MEDIUM);
    });

    it('should set HIGH for ratio > 0.2', () => {
      const merchantState = {
        merchantId: 'merchant-1',
        chargebackCount: 21,
        totalApprovedPayments: 100,
        riskLevel: RiskLevel.LOW
      };

      updateMerchantRiskLevel(merchantState);
      expect(merchantState.riskLevel).toBe(RiskLevel.HIGH);
    });

    it('should set LOW for ratio < 0.1', () => {
      const merchantState = {
        merchantId: 'merchant-1',
        chargebackCount: 9,
        totalApprovedPayments: 100,
        riskLevel: RiskLevel.HIGH
      };

      updateMerchantRiskLevel(merchantState);
      expect(merchantState.riskLevel).toBe(RiskLevel.LOW);
    });

    it('should handle zero chargebacks', () => {
      const merchantState = {
        merchantId: 'merchant-1',
        chargebackCount: 0,
        totalApprovedPayments: 100,
        riskLevel: RiskLevel.HIGH
      };

      updateMerchantRiskLevel(merchantState);
      expect(merchantState.riskLevel).toBe(RiskLevel.LOW);
    });

    it('should handle zero payments', () => {
      const merchantState = {
        merchantId: 'merchant-1',
        chargebackCount: 5,
        totalApprovedPayments: 0,
        riskLevel: RiskLevel.HIGH
      };

      updateMerchantRiskLevel(merchantState);
      expect(merchantState.riskLevel).toBe(RiskLevel.LOW);
    });

    // Testes parametrizados
    it.each([
      [0, 100, RiskLevel.LOW],
      [5, 100, RiskLevel.LOW],
      [9, 100, RiskLevel.LOW],
      [10, 100, RiskLevel.MEDIUM],
      [15, 100, RiskLevel.MEDIUM],
      [20, 100, RiskLevel.MEDIUM],
      [21, 100, RiskLevel.HIGH],
      [30, 100, RiskLevel.HIGH],
      [50, 100, RiskLevel.HIGH],
    ])('should set correct risk level for %d chargebacks and %d payments', (chargebacks, payments, expectedLevel) => {
      const merchantState = {
        merchantId: 'merchant-1',
        chargebackCount: chargebacks,
        totalApprovedPayments: payments,
        riskLevel: RiskLevel.LOW
      };

      updateMerchantRiskLevel(merchantState);
      expect(merchantState.riskLevel).toBe(expectedLevel);
    });
  });
});
