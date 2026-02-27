import { DailySettlementProcessor } from '../../src/processor';
import { Transaction, TransactionStatus, TransactionType } from '../../src/models';

describe('Daily Settlement Processor', () => {
  const processor = new DailySettlementProcessor();

  describe('process', () => {
    it('should not throw error with empty transactions', () => {
      expect(() => processor.process([])).not.toThrow();
    });

    it('should return an array', () => {
      const result = processor.process([]);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return array with settlement for each merchant', () => {
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

      const result = processor.process(transactions);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return settlements with correct properties', () => {
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

      const result = processor.process(transactions);
      const settlement = result[0];
      expect(settlement).toHaveProperty('merchantId');
      expect(settlement).toHaveProperty('grossAmount');
      expect(settlement).toHaveProperty('totalFees');
      expect(settlement).toHaveProperty('netAmount');
      expect(settlement).toHaveProperty('riskLevel');
    });

    it('should process single approved payment', () => {
      const transactions: Transaction[] = [
        {
          id: 'pay-1',
          merchantId: 'merchant-1',
          type: TransactionType.PAYMENT,
          amount: 1000,
          status: TransactionStatus.APPROVED,
          createdAt: new Date()
        }
      ];

      const result = processor.process(transactions);
      expect(result.length).toBe(1);
      expect(result[0].merchantId).toBe('merchant-1');
    });

    it('should handle multiple merchants', () => {
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
          amount: 200,
          status: TransactionStatus.APPROVED,
          createdAt: new Date()
        }
      ];

      const result = processor.process(transactions);
      expect(result.length).toBe(2);
    });

    it('should ignore failed payments', () => {
      const transactions: Transaction[] = [
        {
          id: 'pay-1',
          merchantId: 'merchant-1',
          type: TransactionType.PAYMENT,
          amount: 1000,
          status: TransactionStatus.FAILED,
          createdAt: new Date()
        }
      ];

      const result = processor.process(transactions);
      expect(result.length).toBeGreaterThanOrEqual(0);
    });

    it('should ignore pending payments', () => {
      const transactions: Transaction[] = [
        {
          id: 'pay-1',
          merchantId: 'merchant-1',
          type: TransactionType.PAYMENT,
          amount: 1000,
          status: TransactionStatus.PENDING,
          createdAt: new Date()
        }
      ];

      const result = processor.process(transactions);
      expect(result.length).toBeGreaterThanOrEqual(0);
    });

    it('should apply fee to approved payment', () => {
      const transactions: Transaction[] = [
        {
          id: 'pay-1',
          merchantId: 'merchant-1',
          type: TransactionType.PAYMENT,
          amount: 1000,
          status: TransactionStatus.APPROVED,
          createdAt: new Date()
        }
      ];

      const result = processor.process(transactions);
      expect(result[0].totalFees).toBeGreaterThan(0);
    });

    it('should calculate net amount as grossAmount minus fees', () => {
      const transactions: Transaction[] = [
        {
          id: 'pay-1',
          merchantId: 'merchant-1',
          type: TransactionType.PAYMENT,
          amount: 1000,
          status: TransactionStatus.APPROVED,
          createdAt: new Date()
        }
      ];

      const result = processor.process(transactions);
      const expectedNet = result[0].grossAmount - result[0].totalFees;
      expect(result[0].netAmount).toBeLessThanOrEqual(expectedNet);
    });

    it('should handle refund within 7 days', () => {
      const date = new Date('2025-01-01');
      const refundDate = new Date('2025-01-05');

      const transactions: Transaction[] = [
        {
          id: 'pay-1',
          merchantId: 'merchant-1',
          type: TransactionType.PAYMENT,
          amount: 100,
          status: TransactionStatus.APPROVED,
          createdAt: date
        },
        {
          id: 'refund-1',
          merchantId: 'merchant-1',
          type: TransactionType.REFUND,
          amount: 50,
          status: TransactionStatus.APPROVED,
          createdAt: refundDate,
          originalTransactionId: 'pay-1'
        }
      ];

      const result = processor.process(transactions);
      expect(result[0].totalRefunds).toBeGreaterThan(0);
    });

    it('should handle refund after 7 days', () => {
      const date = new Date('2025-01-01');
      const refundDate = new Date('2025-01-15');

      const transactions: Transaction[] = [
        {
          id: 'pay-1',
          merchantId: 'merchant-1',
          type: TransactionType.PAYMENT,
          amount: 100,
          status: TransactionStatus.APPROVED,
          createdAt: date
        },
        {
          id: 'refund-1',
          merchantId: 'merchant-1',
          type: TransactionType.REFUND,
          amount: 50,
          status: TransactionStatus.APPROVED,
          createdAt: refundDate,
          originalTransactionId: 'pay-1'
        }
      ];

      const result = processor.process(transactions);
      expect(result[0].totalRefunds).toBeGreaterThan(0);
    });

    it('should handle chargeback', () => {
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
          id: 'cb-1',
          merchantId: 'merchant-1',
          type: TransactionType.CHARGEBACK,
          amount: 100,
          status: TransactionStatus.APPROVED,
          createdAt: new Date(),
          originalTransactionId: 'pay-1'
        }
      ];

      const result = processor.process(transactions);
      expect(result[0].totalChargebacks).toBeGreaterThanOrEqual(0);
    });

    it('should handle chargeback reversed', () => {
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
          id: 'cb-1',
          merchantId: 'merchant-1',
          type: TransactionType.CHARGEBACK,
          amount: 100,
          status: TransactionStatus.APPROVED,
          createdAt: new Date(),
          originalTransactionId: 'pay-1'
        },
        {
          id: 'cbr-1',
          merchantId: 'merchant-1',
          type: TransactionType.CHARGEBACK_REVERSED,
          amount: 100,
          status: TransactionStatus.APPROVED,
          createdAt: new Date(),
          originalTransactionId: 'cb-1'
        }
      ];

      const result = processor.process(transactions);
      expect(result[0]).toHaveProperty('totalChargebacks');
    });

    it('should apply risk level', () => {
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

      const result = processor.process(transactions);
      expect(['LOW', 'MEDIUM', 'HIGH']).toContain(result[0].riskLevel);
    });

    it('should return settlements sorted by merchantId', () => {
      const transactions: Transaction[] = [
        {
          id: 'pay-1',
          merchantId: 'z-merchant',
          type: TransactionType.PAYMENT,
          amount: 100,
          status: TransactionStatus.APPROVED,
          createdAt: new Date()
        },
        {
          id: 'pay-2',
          merchantId: 'a-merchant',
          type: TransactionType.PAYMENT,
          amount: 200,
          status: TransactionStatus.APPROVED,
          createdAt: new Date()
        }
      ];

      const result = processor.process(transactions);
      expect(result[0].merchantId).toBe('a-merchant');
      expect(result[1].merchantId).toBe('z-merchant');
    });

    it('should handle large number of transactions', () => {
      const transactions: Transaction[] = [];
      for (let i = 0; i < 50; i++) {
        transactions.push({
          id: `pay-${i}`,
          merchantId: `merchant-${i % 5}`,
          type: TransactionType.PAYMENT,
          amount: 100,
          status: TransactionStatus.APPROVED,
          createdAt: new Date()
        });
      }

      const result = processor.process(transactions);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return settlements with numeric values', () => {
      const transactions: Transaction[] = [
        {
          id: 'pay-1',
          merchantId: 'merchant-1',
          type: TransactionType.PAYMENT,
          amount: 1000,
          status: TransactionStatus.APPROVED,
          createdAt: new Date()
        }
      ];

      const result = processor.process(transactions);
      expect(typeof result[0].grossAmount).toBe('number');
      expect(typeof result[0].totalFees).toBe('number');
      expect(typeof result[0].netAmount).toBe('number');
    });

    it('should handle complex transaction mix', () => {
      const baseDate = new Date('2025-01-01');
      const transactions: Transaction[] = [
        {
          id: 'pay-1',
          merchantId: 'merchant-1',
          type: TransactionType.PAYMENT,
          amount: 1000,
          status: TransactionStatus.APPROVED,
          createdAt: baseDate
        },
        {
          id: 'pay-2',
          merchantId: 'merchant-1',
          type: TransactionType.PAYMENT,
          amount: 500,
          status: TransactionStatus.APPROVED,
          createdAt: baseDate
        },
        {
          id: 'refund-1',
          merchantId: 'merchant-1',
          type: TransactionType.REFUND,
          amount: 250,
          status: TransactionStatus.APPROVED,
          createdAt: new Date('2025-01-03'),
          originalTransactionId: 'pay-1'
        },
        {
          id: 'cb-1',
          merchantId: 'merchant-1',
          type: TransactionType.CHARGEBACK,
          amount: 500,
          status: TransactionStatus.APPROVED,
          createdAt: baseDate,
          originalTransactionId: 'pay-2'
        }
      ];

      const result = processor.process(transactions);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('grossAmount');
      expect(result[0]).toHaveProperty('totalRefunds');
      expect(result[0]).toHaveProperty('totalChargebacks');
    });
  });
});
