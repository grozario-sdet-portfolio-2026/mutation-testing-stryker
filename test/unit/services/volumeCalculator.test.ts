import { calculateApprovedPaymentsVolume, calculateVolumeByMerchant, VolumeMetrics } from '../../../src/services/volumeCalculator';
import { Transaction, TransactionStatus, TransactionType } from '../../../src/models';

describe('Volume Calculator', () => {
  describe('calculateApprovedPaymentsVolume', () => {
    it('should return zero volume and count for empty array', () => {
      const result = calculateApprovedPaymentsVolume([]);
      
      expect(result.totalApprovedPaymentsVolume).toBe(0);
      expect(result.totalApprovedPaymentsCount).toBe(0);
    });

    it('should calculate volume and count for single approved payment', () => {
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

      const result = calculateApprovedPaymentsVolume(transactions);
      
      expect(result.totalApprovedPaymentsVolume).toBe(100);
      expect(result.totalApprovedPaymentsCount).toBe(1);
    });

    it('should calculate volume and count for multiple approved payments', () => {
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
        },
        {
          id: 'pay-3',
          merchantId: 'merchant-1',
          type: TransactionType.PAYMENT,
          amount: 50,
          status: TransactionStatus.APPROVED,
          createdAt: new Date()
        }
      ];

      const result = calculateApprovedPaymentsVolume(transactions);
      
      expect(result.totalApprovedPaymentsVolume).toBe(350);
      expect(result.totalApprovedPaymentsCount).toBe(3);
    });

    it('should ignore pending payments', () => {
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
          merchantId: 'merchant-1',
          type: TransactionType.PAYMENT,
          amount: 200,
          status: TransactionStatus.PENDING,
          createdAt: new Date()
        }
      ];

      const result = calculateApprovedPaymentsVolume(transactions);
      
      expect(result.totalApprovedPaymentsVolume).toBe(100);
      expect(result.totalApprovedPaymentsCount).toBe(1);
    });

    it('should ignore failed payments', () => {
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
          merchantId: 'merchant-1',
          type: TransactionType.PAYMENT,
          amount: 300,
          status: TransactionStatus.FAILED,
          createdAt: new Date()
        }
      ];

      const result = calculateApprovedPaymentsVolume(transactions);
      
      expect(result.totalApprovedPaymentsVolume).toBe(100);
      expect(result.totalApprovedPaymentsCount).toBe(1);
    });

    it('should ignore refund transactions', () => {
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
          id: 'ref-1',
          merchantId: 'merchant-1',
          type: TransactionType.REFUND,
          amount: 50,
          status: TransactionStatus.APPROVED,
          createdAt: new Date(),
          originalTransactionId: 'pay-1'
        }
      ];

      const result = calculateApprovedPaymentsVolume(transactions);
      
      expect(result.totalApprovedPaymentsVolume).toBe(100);
      expect(result.totalApprovedPaymentsCount).toBe(1);
    });

    it('should ignore chargeback transactions', () => {
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

      const result = calculateApprovedPaymentsVolume(transactions);
      
      expect(result.totalApprovedPaymentsVolume).toBe(100);
      expect(result.totalApprovedPaymentsCount).toBe(1);
    });

    it('should ignore chargeback reversed transactions', () => {
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
          id: 'cbr-1',
          merchantId: 'merchant-1',
          type: TransactionType.CHARGEBACK_REVERSED,
          amount: 100,
          status: TransactionStatus.APPROVED,
          createdAt: new Date(),
          originalTransactionId: 'cb-1'
        }
      ];

      const result = calculateApprovedPaymentsVolume(transactions);
      
      expect(result.totalApprovedPaymentsVolume).toBe(100);
      expect(result.totalApprovedPaymentsCount).toBe(1);
    });

    it('should handle mixed transaction types and statuses correctly', () => {
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
          merchantId: 'merchant-1',
          type: TransactionType.PAYMENT,
          amount: 200,
          status: TransactionStatus.PENDING,
          createdAt: new Date()
        },
        {
          id: 'pay-3',
          merchantId: 'merchant-1',
          type: TransactionType.PAYMENT,
          amount: 150,
          status: TransactionStatus.FAILED,
          createdAt: new Date()
        },
        {
          id: 'ref-1',
          merchantId: 'merchant-1',
          type: TransactionType.REFUND,
          amount: 50,
          status: TransactionStatus.APPROVED,
          createdAt: new Date(),
          originalTransactionId: 'pay-1'
        },
        {
          id: 'pay-4',
          merchantId: 'merchant-2',
          type: TransactionType.PAYMENT,
          amount: 300,
          status: TransactionStatus.APPROVED,
          createdAt: new Date()
        }
      ];

      const result = calculateApprovedPaymentsVolume(transactions);
      
      expect(result.totalApprovedPaymentsVolume).toBe(400);
      expect(result.totalApprovedPaymentsCount).toBe(2);
    });

    it('should return zero for array with only non-payment transactions', () => {
      const transactions: Transaction[] = [
        {
          id: 'ref-1',
          merchantId: 'merchant-1',
          type: TransactionType.REFUND,
          amount: 100,
          status: TransactionStatus.APPROVED,
          createdAt: new Date(),
          originalTransactionId: 'pay-1'
        },
        {
          id: 'cb-1',
          merchantId: 'merchant-1',
          type: TransactionType.CHARGEBACK,
          amount: 50,
          status: TransactionStatus.APPROVED,
          createdAt: new Date(),
          originalTransactionId: 'pay-2'
        }
      ];

      const result = calculateApprovedPaymentsVolume(transactions);
      
      expect(result.totalApprovedPaymentsVolume).toBe(0);
      expect(result.totalApprovedPaymentsCount).toBe(0);
    });

    it('should return zero for array with only non-approved payments', () => {
      const transactions: Transaction[] = [
        {
          id: 'pay-1',
          merchantId: 'merchant-1',
          type: TransactionType.PAYMENT,
          amount: 100,
          status: TransactionStatus.PENDING,
          createdAt: new Date()
        },
        {
          id: 'pay-2',
          merchantId: 'merchant-1',
          type: TransactionType.PAYMENT,
          amount: 200,
          status: TransactionStatus.FAILED,
          createdAt: new Date()
        }
      ];

      const result = calculateApprovedPaymentsVolume(transactions);
      
      expect(result.totalApprovedPaymentsVolume).toBe(0);
      expect(result.totalApprovedPaymentsCount).toBe(0);
    });

    it('should handle zero amount approved payments', () => {
      const transactions: Transaction[] = [
        {
          id: 'pay-1',
          merchantId: 'merchant-1',
          type: TransactionType.PAYMENT,
          amount: 0,
          status: TransactionStatus.APPROVED,
          createdAt: new Date()
        }
      ];

      const result = calculateApprovedPaymentsVolume(transactions);
      
      expect(result.totalApprovedPaymentsVolume).toBe(0);
      expect(result.totalApprovedPaymentsCount).toBe(1);
    });

    it('should handle large amounts correctly', () => {
      const transactions: Transaction[] = [
        {
          id: 'pay-1',
          merchantId: 'merchant-1',
          type: TransactionType.PAYMENT,
          amount: 999999.99,
          status: TransactionStatus.APPROVED,
          createdAt: new Date()
        },
        {
          id: 'pay-2',
          merchantId: 'merchant-1',
          type: TransactionType.PAYMENT,
          amount: 1000000.01,
          status: TransactionStatus.APPROVED,
          createdAt: new Date()
        }
      ];

      const result = calculateApprovedPaymentsVolume(transactions);
      
      expect(result.totalApprovedPaymentsVolume).toBe(2000000);
      expect(result.totalApprovedPaymentsCount).toBe(2);
    });
  });

  describe('calculateVolumeByMerchant', () => {
    it('should return empty map for empty array', () => {
      const result = calculateVolumeByMerchant([]);
      
      expect(result.size).toBe(0);
    });

    it('should calculate volume for single merchant with single transaction', () => {
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

      const result = calculateVolumeByMerchant(transactions);
      
      expect(result.size).toBe(1);
      expect(result.get('merchant-1')).toEqual({
        totalApprovedPaymentsVolume: 100,
        totalApprovedPaymentsCount: 1
      });
    });

    it('should calculate volume for single merchant with multiple transactions', () => {
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
          merchantId: 'merchant-1',
          type: TransactionType.PAYMENT,
          amount: 200,
          status: TransactionStatus.APPROVED,
          createdAt: new Date()
        },
        {
          id: 'pay-3',
          merchantId: 'merchant-1',
          type: TransactionType.PAYMENT,
          amount: 50,
          status: TransactionStatus.APPROVED,
          createdAt: new Date()
        }
      ];

      const result = calculateVolumeByMerchant(transactions);
      
      expect(result.size).toBe(1);
      expect(result.get('merchant-1')).toEqual({
        totalApprovedPaymentsVolume: 350,
        totalApprovedPaymentsCount: 3
      });
    });

    it('should calculate volume for multiple merchants', () => {
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
        },
        {
          id: 'pay-3',
          merchantId: 'merchant-1',
          type: TransactionType.PAYMENT,
          amount: 50,
          status: TransactionStatus.APPROVED,
          createdAt: new Date()
        },
        {
          id: 'pay-4',
          merchantId: 'merchant-3',
          type: TransactionType.PAYMENT,
          amount: 300,
          status: TransactionStatus.APPROVED,
          createdAt: new Date()
        }
      ];

      const result = calculateVolumeByMerchant(transactions);
      
      expect(result.size).toBe(3);
      expect(result.get('merchant-1')).toEqual({
        totalApprovedPaymentsVolume: 150,
        totalApprovedPaymentsCount: 2
      });
      expect(result.get('merchant-2')).toEqual({
        totalApprovedPaymentsVolume: 200,
        totalApprovedPaymentsCount: 1
      });
      expect(result.get('merchant-3')).toEqual({
        totalApprovedPaymentsVolume: 300,
        totalApprovedPaymentsCount: 1
      });
    });

    it('should ignore pending payments', () => {
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
          merchantId: 'merchant-1',
          type: TransactionType.PAYMENT,
          amount: 200,
          status: TransactionStatus.PENDING,
          createdAt: new Date()
        }
      ];

      const result = calculateVolumeByMerchant(transactions);
      
      expect(result.size).toBe(1);
      expect(result.get('merchant-1')).toEqual({
        totalApprovedPaymentsVolume: 100,
        totalApprovedPaymentsCount: 1
      });
    });

    it('should ignore failed payments', () => {
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
          merchantId: 'merchant-1',
          type: TransactionType.PAYMENT,
          amount: 300,
          status: TransactionStatus.FAILED,
          createdAt: new Date()
        }
      ];

      const result = calculateVolumeByMerchant(transactions);
      
      expect(result.size).toBe(1);
      expect(result.get('merchant-1')).toEqual({
        totalApprovedPaymentsVolume: 100,
        totalApprovedPaymentsCount: 1
      });
    });

    it('should ignore refund transactions', () => {
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
          id: 'ref-1',
          merchantId: 'merchant-1',
          type: TransactionType.REFUND,
          amount: 50,
          status: TransactionStatus.APPROVED,
          createdAt: new Date(),
          originalTransactionId: 'pay-1'
        }
      ];

      const result = calculateVolumeByMerchant(transactions);
      
      expect(result.size).toBe(1);
      expect(result.get('merchant-1')).toEqual({
        totalApprovedPaymentsVolume: 100,
        totalApprovedPaymentsCount: 1
      });
    });

    it('should ignore chargeback transactions', () => {
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

      const result = calculateVolumeByMerchant(transactions);
      
      expect(result.size).toBe(1);
      expect(result.get('merchant-1')).toEqual({
        totalApprovedPaymentsVolume: 100,
        totalApprovedPaymentsCount: 1
      });
    });

    it('should ignore chargeback reversed transactions', () => {
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
          id: 'cbr-1',
          merchantId: 'merchant-1',
          type: TransactionType.CHARGEBACK_REVERSED,
          amount: 100,
          status: TransactionStatus.APPROVED,
          createdAt: new Date(),
          originalTransactionId: 'cb-1'
        }
      ];

      const result = calculateVolumeByMerchant(transactions);
      
      expect(result.size).toBe(1);
      expect(result.get('merchant-1')).toEqual({
        totalApprovedPaymentsVolume: 100,
        totalApprovedPaymentsCount: 1
      });
    });

    it('should handle mixed transaction types and statuses correctly', () => {
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
          merchantId: 'merchant-1',
          type: TransactionType.PAYMENT,
          amount: 200,
          status: TransactionStatus.PENDING,
          createdAt: new Date()
        },
        {
          id: 'pay-3',
          merchantId: 'merchant-2',
          type: TransactionType.PAYMENT,
          amount: 150,
          status: TransactionStatus.FAILED,
          createdAt: new Date()
        },
        {
          id: 'ref-1',
          merchantId: 'merchant-1',
          type: TransactionType.REFUND,
          amount: 50,
          status: TransactionStatus.APPROVED,
          createdAt: new Date(),
          originalTransactionId: 'pay-1'
        },
        {
          id: 'pay-4',
          merchantId: 'merchant-2',
          type: TransactionType.PAYMENT,
          amount: 300,
          status: TransactionStatus.APPROVED,
          createdAt: new Date()
        }
      ];

      const result = calculateVolumeByMerchant(transactions);
      
      expect(result.size).toBe(2);
      expect(result.get('merchant-1')).toEqual({
        totalApprovedPaymentsVolume: 100,
        totalApprovedPaymentsCount: 1
      });
      expect(result.get('merchant-2')).toEqual({
        totalApprovedPaymentsVolume: 300,
        totalApprovedPaymentsCount: 1
      });
    });

    it('should return empty map for array with only non-payment transactions', () => {
      const transactions: Transaction[] = [
        {
          id: 'ref-1',
          merchantId: 'merchant-1',
          type: TransactionType.REFUND,
          amount: 100,
          status: TransactionStatus.APPROVED,
          createdAt: new Date(),
          originalTransactionId: 'pay-1'
        },
        {
          id: 'cb-1',
          merchantId: 'merchant-1',
          type: TransactionType.CHARGEBACK,
          amount: 50,
          status: TransactionStatus.APPROVED,
          createdAt: new Date(),
          originalTransactionId: 'pay-2'
        }
      ];

      const result = calculateVolumeByMerchant(transactions);
      
      expect(result.size).toBe(0);
    });

    it('should return empty map for array with only non-approved payments', () => {
      const transactions: Transaction[] = [
        {
          id: 'pay-1',
          merchantId: 'merchant-1',
          type: TransactionType.PAYMENT,
          amount: 100,
          status: TransactionStatus.PENDING,
          createdAt: new Date()
        },
        {
          id: 'pay-2',
          merchantId: 'merchant-2',
          type: TransactionType.PAYMENT,
          amount: 200,
          status: TransactionStatus.FAILED,
          createdAt: new Date()
        }
      ];

      const result = calculateVolumeByMerchant(transactions);
      
      expect(result.size).toBe(0);
    });

    it('should handle zero amount approved payments', () => {
      const transactions: Transaction[] = [
        {
          id: 'pay-1',
          merchantId: 'merchant-1',
          type: TransactionType.PAYMENT,
          amount: 0,
          status: TransactionStatus.APPROVED,
          createdAt: new Date()
        }
      ];

      const result = calculateVolumeByMerchant(transactions);
      
      expect(result.size).toBe(1);
      expect(result.get('merchant-1')).toEqual({
        totalApprovedPaymentsVolume: 0,
        totalApprovedPaymentsCount: 1
      });
    });

    it('should handle large amounts correctly for multiple merchants', () => {
      const transactions: Transaction[] = [
        {
          id: 'pay-1',
          merchantId: 'merchant-1',
          type: TransactionType.PAYMENT,
          amount: 999999.99,
          status: TransactionStatus.APPROVED,
          createdAt: new Date()
        },
        {
          id: 'pay-2',
          merchantId: 'merchant-2',
          type: TransactionType.PAYMENT,
          amount: 1000000.01,
          status: TransactionStatus.APPROVED,
          createdAt: new Date()
        }
      ];

      const result = calculateVolumeByMerchant(transactions);
      
      expect(result.size).toBe(2);
      expect(result.get('merchant-1')).toEqual({
        totalApprovedPaymentsVolume: 999999.99,
        totalApprovedPaymentsCount: 1
      });
      expect(result.get('merchant-2')).toEqual({
        totalApprovedPaymentsVolume: 1000000.01,
        totalApprovedPaymentsCount: 1
      });
    });

    it('should correctly accumulate when merchant appears multiple times', () => {
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
          amount: 50,
          status: TransactionStatus.APPROVED,
          createdAt: new Date()
        },
        {
          id: 'pay-3',
          merchantId: 'merchant-1',
          type: TransactionType.PAYMENT,
          amount: 200,
          status: TransactionStatus.APPROVED,
          createdAt: new Date()
        },
        {
          id: 'pay-4',
          merchantId: 'merchant-2',
          type: TransactionType.PAYMENT,
          amount: 75,
          status: TransactionStatus.APPROVED,
          createdAt: new Date()
        },
        {
          id: 'pay-5',
          merchantId: 'merchant-1',
          type: TransactionType.PAYMENT,
          amount: 150,
          status: TransactionStatus.APPROVED,
          createdAt: new Date()
        }
      ];

      const result = calculateVolumeByMerchant(transactions);
      
      expect(result.size).toBe(2);
      expect(result.get('merchant-1')).toEqual({
        totalApprovedPaymentsVolume: 450,
        totalApprovedPaymentsCount: 3
      });
      expect(result.get('merchant-2')).toEqual({
        totalApprovedPaymentsVolume: 125,
        totalApprovedPaymentsCount: 2
      });
    });
  });
});
