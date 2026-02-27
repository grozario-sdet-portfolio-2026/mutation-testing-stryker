import {
  groupTransactionsByMerchant,
  generateDailySettlement,
  calculateNetAmount,
  MerchantAggregation
} from '../../../src/services/settlementProcessor';
import { Transaction, TransactionStatus, TransactionType, RiskLevel } from '../../../src/models';

describe('Settlement Processor', () => {
  describe('groupTransactionsByMerchant', () => {
    it('should not throw error with empty transactions', () => {
      expect(() => groupTransactionsByMerchant([], new Map(), new Map())).not.toThrow();
    });

    it('should return a Map', () => {
      const result = groupTransactionsByMerchant([], new Map(), new Map());
      expect(result instanceof Map).toBe(true);
    });

    it('should aggregate payments by merchant', () => {
      const transactions: Transaction[] = [
        {
          id: 'pay-1',
          merchantId: 'merchant-1',
          type: TransactionType.PAYMENT,
          amount: 100,
          status: TransactionStatus.APPROVED,
          createdAt: new Date()
        }
      ];

      const result = groupTransactionsByMerchant(transactions, new Map(), new Map());
      expect(result.has('merchant-1')).toBe(true);
    });

    it('should group multiple merchants separately', () => {
      const transactions: Transaction[] = [
        {
          id: 'pay-1',
          merchantId: 'merchant-1',
          type: TransactionType.PAYMENT,
          amount: 100,
          status: TransactionStatus.APPROVED,
          createdAt: new Date()
        },
        {
          id: 'pay-2',
          merchantId: 'merchant-2',
          type: TransactionType.PAYMENT,
          amount: 100,
          status: TransactionStatus.APPROVED,
          createdAt: new Date()
        }
      ];

      const result = groupTransactionsByMerchant(transactions, new Map(), new Map());
      expect(result.size).toBe(2);
    });

    it('should calculate gross amount for approved payments', () => {
      const transactions: Transaction[] = [
        {
          id: 'pay-1',
          merchantId: 'merchant-1',
          type: TransactionType.PAYMENT,
          amount: 100,
          status: TransactionStatus.APPROVED,
          createdAt: new Date()
        }
      ];

      const result = groupTransactionsByMerchant(transactions, new Map(), new Map());
      const agg = result.get('merchant-1');
      expect(agg?.grossAmount).toBe(100);
    });

    it('should return object with all required properties', () => {
      const transactions: Transaction[] = [
        {
          id: 'pay-1',
          merchantId: 'merchant-1',
          type: TransactionType.PAYMENT,
          amount: 100,
          status: TransactionStatus.APPROVED,
          createdAt: new Date()
        }
      ];

      const result = groupTransactionsByMerchant(transactions, new Map(), new Map());
      const agg = result.get('merchant-1');
      expect(agg).toHaveProperty('merchantId');
      expect(agg).toHaveProperty('grossAmount');
      expect(agg).toHaveProperty('totalFees');
      expect(agg).toHaveProperty('totalRefunds');
      expect(agg).toHaveProperty('totalChargebacks');
      expect(agg).toHaveProperty('totalPenalties');
    });

    it('should handle refunds', () => {
      const transactions: Transaction[] = [
        {
          id: 'refund-1',
          merchantId: 'merchant-1',
          type: TransactionType.REFUND,
          amount: 50,
          status: TransactionStatus.APPROVED,
          createdAt: new Date()
        }
      ];

      const result = groupTransactionsByMerchant(transactions, new Map(), new Map());
      const agg = result.get('merchant-1');
      expect(agg?.totalRefunds).toBeGreaterThanOrEqual(0);
    });

    it('should handle chargebacks', () => {
      const transactions: Transaction[] = [
        {
          id: 'cb-1',
          merchantId: 'merchant-1',
          type: TransactionType.CHARGEBACK,
          amount: 100,
          status: TransactionStatus.APPROVED,
          createdAt: new Date()
        }
      ];

      const result = groupTransactionsByMerchant(transactions, new Map(), new Map());
      const agg = result.get('merchant-1');
      expect(agg?.totalChargebacks).toBe(100);
    });

    it('should handle large transaction lists', () => {
      const transactions: Transaction[] = [];
      for (let i = 0; i < 100; i++) {
        transactions.push({
          id: `pay-${i}`,
          merchantId: 'merchant-1',
          type: TransactionType.PAYMENT,
          amount: 100,
          status: TransactionStatus.APPROVED,
          createdAt: new Date()
        });
      }

      const result = groupTransactionsByMerchant(transactions, new Map(), new Map());
      expect(result.has('merchant-1')).toBe(true);
    });
  });

  describe('calculateNetAmount', () => {
    it('should not throw error', () => {
      const agg: MerchantAggregation = {
        merchantId: 'merchant-1',
        grossAmount: 1000,
        totalFees: 50,
        totalRefunds: 0,
        totalChargebacks: 0,
        totalPenalties: 0,
        chargebackCount: 0,
        approvedPaymentCount: 10
      };

      expect(() => calculateNetAmount(agg)).not.toThrow();
    });

    it('should return a number', () => {
      const agg: MerchantAggregation = {
        merchantId: 'merchant-1',
        grossAmount: 1000,
        totalFees: 50,
        totalRefunds: 0,
        totalChargebacks: 0,
        totalPenalties: 0,
        chargebackCount: 0,
        approvedPaymentCount: 10
      };

      const result = calculateNetAmount(agg);
      expect(typeof result).toBe('number');
    });

    it('should return net amount less than gross', () => {
      const agg: MerchantAggregation = {
        merchantId: 'merchant-1',
        grossAmount: 1000,
        totalFees: 50,
        totalRefunds: 0,
        totalChargebacks: 0,
        totalPenalties: 0,
        chargebackCount: 0,
        approvedPaymentCount: 10
      };

      const result = calculateNetAmount(agg);
      expect(result).toBeLessThan(agg.grossAmount);
    });

    it('should subtract all deductions', () => {
      const agg: MerchantAggregation = {
        merchantId: 'merchant-1',
        grossAmount: 1000,
        totalFees: 100,
        totalRefunds: 50,
        totalChargebacks: 200,
        totalPenalties: 50,
        chargebackCount: 2,
        approvedPaymentCount: 10
      };

      const result = calculateNetAmount(agg);
      const expected = 1000 - 100 - 50 - 200 - 50;
      expect(result).toBeLessThanOrEqual(expected);
    });

    it('should handle zero deductions', () => {
      const agg: MerchantAggregation = {
        merchantId: 'merchant-1',
        grossAmount: 1000,
        totalFees: 0,
        totalRefunds: 0,
        totalChargebacks: 0,
        totalPenalties: 0,
        chargebackCount: 0,
        approvedPaymentCount: 10
      };

      const result = calculateNetAmount(agg);
      expect(result).toBe(1000);
    });

    it('should handle large amounts', () => {
      const agg: MerchantAggregation = {
        merchantId: 'merchant-1',
        grossAmount: 1000000,
        totalFees: 50000,
        totalRefunds: 10000,
        totalChargebacks: 100000,
        totalPenalties: 5000,
        chargebackCount: 5,
        approvedPaymentCount: 500
      };

      const result = calculateNetAmount(agg);
      expect(typeof result).toBe('number');
    });
  });

  describe('generateDailySettlement', () => {
    it('should not throw error', () => {
      const agg: MerchantAggregation = {
        merchantId: 'merchant-1',
        grossAmount: 1000,
        totalFees: 50,
        totalRefunds: 0,
        totalChargebacks: 0,
        totalPenalties: 0,
        chargebackCount: 0,
        approvedPaymentCount: 10
      };

      expect(() => generateDailySettlement(agg)).not.toThrow();
    });

    it('should return DailySettlement object', () => {
      const agg: MerchantAggregation = {
        merchantId: 'merchant-1',
        grossAmount: 1000,
        totalFees: 50,
        totalRefunds: 0,
        totalChargebacks: 0,
        totalPenalties: 0,
        chargebackCount: 0,
        approvedPaymentCount: 10
      };

      const result = generateDailySettlement(agg);
      expect(result).toHaveProperty('merchantId');
      expect(result).toHaveProperty('grossAmount');
      expect(result).toHaveProperty('totalFees');
      expect(result).toHaveProperty('netAmount');
      expect(result).toHaveProperty('riskLevel');
    });

    it('should return correct merchantId', () => {
      const agg: MerchantAggregation = {
        merchantId: 'merchant-xyz',
        grossAmount: 1000,
        totalFees: 50,
        totalRefunds: 0,
        totalChargebacks: 0,
        totalPenalties: 0,
        chargebackCount: 0,
        approvedPaymentCount: 10
      };

      const result = generateDailySettlement(agg);
      expect(result.merchantId).toBe('merchant-xyz');
    });

    it('should have riskLevel property', () => {
      const agg: MerchantAggregation = {
        merchantId: 'merchant-1',
        grossAmount: 1000,
        totalFees: 50,
        totalRefunds: 0,
        totalChargebacks: 0,
        totalPenalties: 0,
        chargebackCount: 0,
        approvedPaymentCount: 10
      };

      const result = generateDailySettlement(agg);
      expect(['LOW', 'MEDIUM', 'HIGH']).toContain(result.riskLevel);
    });

    it('should set LOW risk for zero chargebacks', () => {
      const agg: MerchantAggregation = {
        merchantId: 'merchant-1',
        grossAmount: 1000,
        totalFees: 50,
        totalRefunds: 0,
        totalChargebacks: 0,
        totalPenalties: 0,
        chargebackCount: 0,
        approvedPaymentCount: 100
      };

      const result = generateDailySettlement(agg);
      expect(result.riskLevel).toBe('LOW');
    });

    it('should set HIGH risk for high chargeback ratio', () => {
      const agg: MerchantAggregation = {
        merchantId: 'merchant-1',
        grossAmount: 100,
        totalFees: 5,
        totalRefunds: 0,
        totalChargebacks: 100,
        totalPenalties: 15,
        chargebackCount: 50,
        approvedPaymentCount: 100
      };

      const result = generateDailySettlement(agg);
      expect(result.riskLevel).toBe('HIGH');
    });

    it('should handle multiple properties correctly', () => {
      const agg: MerchantAggregation = {
        merchantId: 'merchant-1',
        grossAmount: 1000,
        totalFees: 50,
        totalRefunds: 100,
        totalChargebacks: 200,
        totalPenalties: 50,
        chargebackCount: 5,
        approvedPaymentCount: 20
      };

      const result = generateDailySettlement(agg);
      expect(result.grossAmount).toBe(1000);
      expect(result.totalFees).toBe(50);
      expect(result.totalRefunds).toBe(100);
    });
  });
});
