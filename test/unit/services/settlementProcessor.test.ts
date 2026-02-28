import {
  groupTransactionsByMerchant,
  generateDailySettlement,
  generateDailySettlements,
  calculateNetAmount,
  MerchantAggregation
} from '../../../src/services/settlementProcessor';
import { Transaction, TransactionStatus, TransactionType, RiskLevel } from '../../../src/models';

describe('Settlement Processor', () => {
  describe('groupTransactionsByMerchant', () => {
    it('should return empty map for empty transactions array', () => {
      const result = groupTransactionsByMerchant([], new Map(), new Map());
      
      expect(result.size).toBe(0);
    });

    it('should create aggregation for single approved payment', () => {
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
      
      expect(result.size).toBe(1);
      expect(agg?.merchantId).toBe('merchant-1');
      expect(agg?.grossAmount).toBe(100);
      expect(agg?.totalFees).toBe(0);
      expect(agg?.totalRefunds).toBe(0);
      expect(agg?.totalChargebacks).toBe(0);
      expect(agg?.totalPenalties).toBe(0);
      expect(agg?.chargebackCount).toBe(0);
      expect(agg?.approvedPaymentCount).toBe(1);
    });

    it('should aggregate multiple approved payments for same merchant', () => {
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
        }
      ];

      const result = groupTransactionsByMerchant(transactions, new Map(), new Map());
      const agg = result.get('merchant-1');
      
      expect(result.size).toBe(1);
      expect(agg?.grossAmount).toBe(300);
      expect(agg?.approvedPaymentCount).toBe(2);
    });

    it('should group transactions by different merchants', () => {
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

      const result = groupTransactionsByMerchant(transactions, new Map(), new Map());
      
      expect(result.size).toBe(2);
      expect(result.get('merchant-1')?.grossAmount).toBe(100);
      expect(result.get('merchant-2')?.grossAmount).toBe(200);
    });

    it('should add payment fees to total fees', () => {
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
      const paymentFees = new Map([['pay-1', 5]]);

      const result = groupTransactionsByMerchant(transactions, paymentFees, new Map());
      const agg = result.get('merchant-1');
      
      expect(agg?.totalFees).toBe(5);
    });

    it('should not count pending payments in gross amount', () => {
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

      const result = groupTransactionsByMerchant(transactions, new Map(), new Map());
      const agg = result.get('merchant-1');
      
      expect(agg?.grossAmount).toBe(100);
      expect(agg?.approvedPaymentCount).toBe(1);
    });

    it('should not count failed payments in gross amount', () => {
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

      const result = groupTransactionsByMerchant(transactions, new Map(), new Map());
      const agg = result.get('merchant-1');
      
      expect(agg?.grossAmount).toBe(100);
      expect(agg?.approvedPaymentCount).toBe(1);
    });

    it('should add refund amounts to total refunds', () => {
      const transactions: Transaction[] = [
        {
          id: 'refund-1',
          merchantId: 'merchant-1',
          type: TransactionType.REFUND,
          amount: 50,
          status: TransactionStatus.APPROVED,
          createdAt: new Date(),
          originalTransactionId: 'pay-1'
        }
      ];

      const result = groupTransactionsByMerchant(transactions, new Map(), new Map());
      const agg = result.get('merchant-1');
      
      expect(agg?.totalRefunds).toBe(50);
      expect(agg?.grossAmount).toBe(0);
    });

    it('should subtract refund fees from total fees', () => {
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
          id: 'refund-1',
          merchantId: 'merchant-1',
          type: TransactionType.REFUND,
          amount: 50,
          status: TransactionStatus.APPROVED,
          createdAt: new Date(),
          originalTransactionId: 'pay-1'
        }
      ];
      const paymentFees = new Map([
        ['pay-1', 5],
        ['refund-1', 2.5]
      ]);

      const result = groupTransactionsByMerchant(transactions, paymentFees, new Map());
      const agg = result.get('merchant-1');
      
      expect(agg?.totalFees).toBe(2.5); // 5 - 2.5
      expect(agg?.totalRefunds).toBe(50);
    });

    it('should add chargeback amounts to total chargebacks', () => {
      const transactions: Transaction[] = [
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

      const result = groupTransactionsByMerchant(transactions, new Map(), new Map());
      const agg = result.get('merchant-1');
      
      expect(agg?.totalChargebacks).toBe(100);
      expect(agg?.chargebackCount).toBe(1);
    });

    it('should add chargeback penalties to total penalties', () => {
      const transactions: Transaction[] = [
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
      const chargebackPenalties = new Map([['cb-1', 15]]);

      const result = groupTransactionsByMerchant(transactions, new Map(), chargebackPenalties);
      const agg = result.get('merchant-1');
      
      expect(agg?.totalPenalties).toBe(15);
    });

    it('should subtract chargeback reversed amounts from total chargebacks', () => {
      const transactions: Transaction[] = [
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

      const result = groupTransactionsByMerchant(transactions, new Map(), new Map());
      const agg = result.get('merchant-1');
      
      expect(agg?.totalChargebacks).toBe(0);
    });

    it('should decrement chargeback count for chargeback reversed', () => {
      const transactions: Transaction[] = [
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

      const result = groupTransactionsByMerchant(transactions, new Map(), new Map());
      const agg = result.get('merchant-1');
      
      expect(agg?.chargebackCount).toBe(0);
    });

    it('should not let chargeback count go negative with reversed chargebacks', () => {
      const transactions: Transaction[] = [
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

      const result = groupTransactionsByMerchant(transactions, new Map(), new Map());
      const agg = result.get('merchant-1');
      
      expect(agg?.chargebackCount).toBe(0);
    });

    it('should subtract reversed chargeback penalties from total penalties', () => {
      const transactions: Transaction[] = [
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
      const chargebackPenalties = new Map([
        ['cb-1', 15],
        ['cbr-1', 15]
      ]);

      const result = groupTransactionsByMerchant(transactions, new Map(), chargebackPenalties);
      const agg = result.get('merchant-1');
      
      expect(agg?.totalPenalties).toBe(0);
    });

    it('should round all amounts to 2 decimal places', () => {
      const transactions: Transaction[] = [
        {
          id: 'pay-1',
          merchantId: 'merchant-1',
          type: TransactionType.PAYMENT,
          amount: 100.333,
          status: TransactionStatus.APPROVED,
          createdAt: new Date()
        },
        {
          id: 'pay-2',
          merchantId: 'merchant-1',
          type: TransactionType.PAYMENT,
          amount: 50.667,
          status: TransactionStatus.APPROVED,
          createdAt: new Date()
        }
      ];
      const paymentFees = new Map([
        ['pay-1', 5.111],
        ['pay-2', 2.556]
      ]);

      const result = groupTransactionsByMerchant(transactions, paymentFees, new Map());
      const agg = result.get('merchant-1');
      
      expect(agg?.grossAmount).toBe(151);
      expect(agg?.totalFees).toBe(7.67);
    });

    it('should handle complex scenario with all transaction types', () => {
      const transactions: Transaction[] = [
        {
          id: 'pay-1',
          merchantId: 'merchant-1',
          type: TransactionType.PAYMENT,
          amount: 1000,
          status: TransactionStatus.APPROVED,
          createdAt: new Date()
        },
        {
          id: 'pay-2',
          merchantId: 'merchant-1',
          type: TransactionType.PAYMENT,
          amount: 500,
          status: TransactionStatus.APPROVED,
          createdAt: new Date()
        },
        {
          id: 'pay-3',
          merchantId: 'merchant-1',
          type: TransactionType.PAYMENT,
          amount: 200,
          status: TransactionStatus.PENDING,
          createdAt: new Date()
        },
        {
          id: 'refund-1',
          merchantId: 'merchant-1',
          type: TransactionType.REFUND,
          amount: 300,
          status: TransactionStatus.APPROVED,
          createdAt: new Date(),
          originalTransactionId: 'pay-1'
        },
        {
          id: 'cb-1',
          merchantId: 'merchant-1',
          type: TransactionType.CHARGEBACK,
          amount: 500,
          status: TransactionStatus.APPROVED,
          createdAt: new Date(),
          originalTransactionId: 'pay-2'
        },
        {
          id: 'cb-2',
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
          originalTransactionId: 'cb-2'
        }
      ];
      const paymentFees = new Map([
        ['pay-1', 50],
        ['pay-2', 25],
        ['refund-1', 15]
      ]);
      const chargebackPenalties = new Map([
        ['cb-1', 15],
        ['cb-2', 15],
        ['cbr-1', 15]
      ]);

      const result = groupTransactionsByMerchant(transactions, paymentFees, chargebackPenalties);
      const agg = result.get('merchant-1');
      
      expect(agg?.grossAmount).toBe(1500);
      expect(agg?.approvedPaymentCount).toBe(2);
      expect(agg?.totalFees).toBe(60); // 50 + 25 - 15
      expect(agg?.totalRefunds).toBe(300);
      expect(agg?.totalChargebacks).toBe(500); // 500 + 100 - 100
      expect(agg?.chargebackCount).toBe(1); // 2 - 1
      expect(agg?.totalPenalties).toBe(15); // 15 + 15 - 15
    });

    it('should handle multiple merchants with different transaction types', () => {
      const transactions: Transaction[] = [
        {
          id: 'pay-1',
          merchantId: 'merchant-1',
          type: TransactionType.PAYMENT,
          amount: 1000,
          status: TransactionStatus.APPROVED,
          createdAt: new Date()
        },
        {
          id: 'pay-2',
          merchantId: 'merchant-2',
          type: TransactionType.PAYMENT,
          amount: 2000,
          status: TransactionStatus.APPROVED,
          createdAt: new Date()
        },
        {
          id: 'refund-1',
          merchantId: 'merchant-1',
          type: TransactionType.REFUND,
          amount: 100,
          status: TransactionStatus.APPROVED,
          createdAt: new Date(),
          originalTransactionId: 'pay-1'
        }
      ];

      const result = groupTransactionsByMerchant(transactions, new Map(), new Map());
      
      expect(result.size).toBe(2);
      expect(result.get('merchant-1')?.grossAmount).toBe(1000);
      expect(result.get('merchant-1')?.totalRefunds).toBe(100);
      expect(result.get('merchant-2')?.grossAmount).toBe(2000);
      expect(result.get('merchant-2')?.totalRefunds).toBe(0);
    });
  });

  describe('calculateNetAmount', () => {
    it('should calculate exact net amount with no deductions', () => {
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

    it('should calculate exact net amount subtracting fees only', () => {
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
      expect(result).toBe(950);
    });

    it('should calculate exact net amount subtracting all deductions', () => {
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
      expect(result).toBe(600);
    });

    it('should round to 2 decimal places', () => {
      const agg: MerchantAggregation = {
        merchantId: 'merchant-1',
        grossAmount: 100.33,
        totalFees: 5.02,
        totalRefunds: 10.11,
        totalChargebacks: 15.15,
        totalPenalties: 3.03,
        chargebackCount: 1,
        approvedPaymentCount: 5
      };

      const result = calculateNetAmount(agg);
      expect(result).toBe(67.02);
    });

    it('should handle decimal amounts with proper rounding', () => {
      const agg: MerchantAggregation = {
        merchantId: 'merchant-1',
        grossAmount: 123.456,
        totalFees: 6.17,
        totalRefunds: 33.33,
        totalChargebacks: 50.50,
        totalPenalties: 15,
        chargebackCount: 3,
        approvedPaymentCount: 10
      };

      const result = calculateNetAmount(agg);
      expect(result).toBe(18.46);
    });

    it('should handle zero gross amount', () => {
      const agg: MerchantAggregation = {
        merchantId: 'merchant-1',
        grossAmount: 0,
        totalFees: 0,
        totalRefunds: 0,
        totalChargebacks: 0,
        totalPenalties: 0,
        chargebackCount: 0,
        approvedPaymentCount: 0
      };

      const result = calculateNetAmount(agg);
      expect(result).toBe(0);
    });

    it('should handle negative net amount', () => {
      const agg: MerchantAggregation = {
        merchantId: 'merchant-1',
        grossAmount: 100,
        totalFees: 50,
        totalRefunds: 30,
        totalChargebacks: 50,
        totalPenalties: 20,
        chargebackCount: 3,
        approvedPaymentCount: 5
      };

      const result = calculateNetAmount(agg);
      expect(result).toBe(-50);
    });

    it('should calculate correct net when refunds exceed fees', () => {
      const agg: MerchantAggregation = {
        merchantId: 'merchant-1',
        grossAmount: 1000,
        totalFees: 10,
        totalRefunds: 500,
        totalChargebacks: 0,
        totalPenalties: 0,
        chargebackCount: 0,
        approvedPaymentCount: 10
      };

      const result = calculateNetAmount(agg);
      expect(result).toBe(490);
    });

    it('should calculate correct net when chargebacks are present', () => {
      const agg: MerchantAggregation = {
        merchantId: 'merchant-1',
        grossAmount: 1000,
        totalFees: 50,
        totalRefunds: 0,
        totalChargebacks: 300,
        totalPenalties: 0,
        chargebackCount: 3,
        approvedPaymentCount: 10
      };

      const result = calculateNetAmount(agg);
      expect(result).toBe(650);
    });

    it('should calculate correct net when penalties are present', () => {
      const agg: MerchantAggregation = {
        merchantId: 'merchant-1',
        grossAmount: 1000,
        totalFees: 50,
        totalRefunds: 0,
        totalChargebacks: 0,
        totalPenalties: 75,
        chargebackCount: 5,
        approvedPaymentCount: 10
      };

      const result = calculateNetAmount(agg);
      expect(result).toBe(875);
    });

    it('should handle large amounts correctly', () => {
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
      expect(result).toBe(835000);
    });

    it('should handle very small decimal amounts', () => {
      const agg: MerchantAggregation = {
        merchantId: 'merchant-1',
        grossAmount: 0.99,
        totalFees: 0.05,
        totalRefunds: 0.10,
        totalChargebacks: 0.20,
        totalPenalties: 0.03,
        chargebackCount: 1,
        approvedPaymentCount: 1
      };

      const result = calculateNetAmount(agg);
      expect(result).toBe(0.61);
    });
  });

  describe('generateDailySettlement', () => {
    it('should return settlement with all required properties', () => {
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
      expect(result).toHaveProperty('totalRefunds');
      expect(result).toHaveProperty('totalChargebacks');
      expect(result).toHaveProperty('totalPenalties');
      expect(result).toHaveProperty('netAmount');
      expect(result).toHaveProperty('riskLevel');
    });

    it('should map merchantId correctly', () => {
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

    it('should map grossAmount correctly', () => {
      const agg: MerchantAggregation = {
        merchantId: 'merchant-1',
        grossAmount: 1234.56,
        totalFees: 50,
        totalRefunds: 0,
        totalChargebacks: 0,
        totalPenalties: 0,
        chargebackCount: 0,
        approvedPaymentCount: 10
      };

      const result = generateDailySettlement(agg);
      
      expect(result.grossAmount).toBe(1234.56);
    });

    it('should map totalFees correctly', () => {
      const agg: MerchantAggregation = {
        merchantId: 'merchant-1',
        grossAmount: 1000,
        totalFees: 123.45,
        totalRefunds: 0,
        totalChargebacks: 0,
        totalPenalties: 0,
        chargebackCount: 0,
        approvedPaymentCount: 10
      };

      const result = generateDailySettlement(agg);
      
      expect(result.totalFees).toBe(123.45);
    });

    it('should map totalRefunds correctly', () => {
      const agg: MerchantAggregation = {
        merchantId: 'merchant-1',
        grossAmount: 1000,
        totalFees: 50,
        totalRefunds: 200.50,
        totalChargebacks: 0,
        totalPenalties: 0,
        chargebackCount: 0,
        approvedPaymentCount: 10
      };

      const result = generateDailySettlement(agg);
      
      expect(result.totalRefunds).toBe(200.50);
    });

    it('should map totalChargebacks correctly', () => {
      const agg: MerchantAggregation = {
        merchantId: 'merchant-1',
        grossAmount: 1000,
        totalFees: 50,
        totalRefunds: 0,
        totalChargebacks: 300.75,
        totalPenalties: 0,
        chargebackCount: 3,
        approvedPaymentCount: 10
      };

      const result = generateDailySettlement(agg);
      
      expect(result.totalChargebacks).toBe(300.75);
    });

    it('should map totalPenalties correctly', () => {
      const agg: MerchantAggregation = {
        merchantId: 'merchant-1',
        grossAmount: 1000,
        totalFees: 50,
        totalRefunds: 0,
        totalChargebacks: 0,
        totalPenalties: 45.25,
        chargebackCount: 3,
        approvedPaymentCount: 10
      };

      const result = generateDailySettlement(agg);
      
      expect(result.totalPenalties).toBe(45.25);
    });

    it('should calculate netAmount correctly', () => {
      const agg: MerchantAggregation = {
        merchantId: 'merchant-1',
        grossAmount: 1000,
        totalFees: 50,
        totalRefunds: 100,
        totalChargebacks: 200,
        totalPenalties: 50,
        chargebackCount: 2,
        approvedPaymentCount: 10
      };

      const result = generateDailySettlement(agg);
      
      expect(result.netAmount).toBe(600);
    });

    it('should set LOW risk level when no chargebacks', () => {
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

    it('should set LOW risk level for low chargeback ratio', () => {
      const agg: MerchantAggregation = {
        merchantId: 'merchant-1',
        grossAmount: 10000,
        totalFees: 500,
        totalRefunds: 0,
        totalChargebacks: 100,
        totalPenalties: 15,
        chargebackCount: 1,
        approvedPaymentCount: 1000
      };

      const result = generateDailySettlement(agg);
      
      expect(result.riskLevel).toBe('LOW');
    });

    it('should set MEDIUM risk level for medium chargeback ratio', () => {
      const agg: MerchantAggregation = {
        merchantId: 'merchant-1',
        grossAmount: 1000,
        totalFees: 50,
        totalRefunds: 0,
        totalChargebacks: 200,
        totalPenalties: 30,
        chargebackCount: 15,
        approvedPaymentCount: 100
      };

      const result = generateDailySettlement(agg);
      
      expect(result.riskLevel).toBe('MEDIUM');
    });

    it('should set HIGH risk level for high chargeback ratio', () => {
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

    it('should handle zero approved payments', () => {
      const agg: MerchantAggregation = {
        merchantId: 'merchant-1',
        grossAmount: 0,
        totalFees: 0,
        totalRefunds: 0,
        totalChargebacks: 0,
        totalPenalties: 0,
        chargebackCount: 0,
        approvedPaymentCount: 0
      };

      const result = generateDailySettlement(agg);
      
      expect(result.netAmount).toBe(0);
      expect(result.riskLevel).toBe('LOW');
    });

    it('should generate complete settlement for complex scenario', () => {
      const agg: MerchantAggregation = {
        merchantId: 'merchant-complex',
        grossAmount: 5000.50,
        totalFees: 250.25,
        totalRefunds: 500.10,
        totalChargebacks: 750.30,
        totalPenalties: 112.50,
        chargebackCount: 15,
        approvedPaymentCount: 100
      };

      const result = generateDailySettlement(agg);
      
      expect(result.merchantId).toBe('merchant-complex');
      expect(result.grossAmount).toBe(5000.50);
      expect(result.totalFees).toBe(250.25);
      expect(result.totalRefunds).toBe(500.10);
      expect(result.totalChargebacks).toBe(750.30);
      expect(result.totalPenalties).toBe(112.50);
      expect(result.netAmount).toBe(3387.35);
      expect(result.riskLevel).toBe('MEDIUM');
    });
  });

  describe('generateDailySettlements', () => {
    it('should return empty array for empty transactions', () => {
      const result = generateDailySettlements([], new Map(), new Map());
      
      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });

    it('should generate settlement for single merchant', () => {
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
      const paymentFees = new Map([['pay-1', 50]]);

      const result = generateDailySettlements(transactions, paymentFees, new Map());
      
      expect(result.length).toBe(1);
      expect(result[0].merchantId).toBe('merchant-1');
      expect(result[0].grossAmount).toBe(1000);
      expect(result[0].totalFees).toBe(50);
      expect(result[0].netAmount).toBe(950);
    });

    it('should generate settlements for multiple merchants', () => {
      const transactions: Transaction[] = [
        {
          id: 'pay-1',
          merchantId: 'merchant-1',
          type: TransactionType.PAYMENT,
          amount: 1000,
          status: TransactionStatus.APPROVED,
          createdAt: new Date()
        },
        {
          id: 'pay-2',
          merchantId: 'merchant-2',
          type: TransactionType.PAYMENT,
          amount: 2000,
          status: TransactionStatus.APPROVED,
          createdAt: new Date()
        },
        {
          id: 'pay-3',
          merchantId: 'merchant-3',
          type: TransactionType.PAYMENT,
          amount: 3000,
          status: TransactionStatus.APPROVED,
          createdAt: new Date()
        }
      ];

      const result = generateDailySettlements(transactions, new Map(), new Map());
      
      expect(result.length).toBe(3);
      
      const merchant1Settlement = result.find(s => s.merchantId === 'merchant-1');
      const merchant2Settlement = result.find(s => s.merchantId === 'merchant-2');
      const merchant3Settlement = result.find(s => s.merchantId === 'merchant-3');
      
      expect(merchant1Settlement?.grossAmount).toBe(1000);
      expect(merchant2Settlement?.grossAmount).toBe(2000);
      expect(merchant3Settlement?.grossAmount).toBe(3000);
    });

    it('should generate settlement with all transaction types', () => {
      const transactions: Transaction[] = [
        {
          id: 'pay-1',
          merchantId: 'merchant-1',
          type: TransactionType.PAYMENT,
          amount: 1000,
          status: TransactionStatus.APPROVED,
          createdAt: new Date()
        },
        {
          id: 'refund-1',
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
          amount: 200,
          status: TransactionStatus.APPROVED,
          createdAt: new Date(),
          originalTransactionId: 'pay-1'
        }
      ];
      const paymentFees = new Map([['pay-1', 50], ['refund-1', 5]]);
      const chargebackPenalties = new Map([['cb-1', 15]]);

      const result = generateDailySettlements(transactions, paymentFees, chargebackPenalties);
      
      expect(result.length).toBe(1);
      expect(result[0].merchantId).toBe('merchant-1');
      expect(result[0].grossAmount).toBe(1000);
      expect(result[0].totalFees).toBe(45); // 50 - 5
      expect(result[0].totalRefunds).toBe(100);
      expect(result[0].totalChargebacks).toBe(200);
      expect(result[0].totalPenalties).toBe(15);
      expect(result[0].netAmount).toBe(640);
    });

    it('should handle merchant with only refunds', () => {
      const transactions: Transaction[] = [
        {
          id: 'pay-1',
          merchantId: 'merchant-1',
          type: TransactionType.PAYMENT,
          amount: 1000,
          status: TransactionStatus.APPROVED,
          createdAt: new Date()
        },
        {
          id: 'refund-1',
          merchantId: 'merchant-2',
          type: TransactionType.REFUND,
          amount: 100,
          status: TransactionStatus.APPROVED,
          createdAt: new Date(),
          originalTransactionId: 'other-pay'
        }
      ];

      const result = generateDailySettlements(transactions, new Map(), new Map());
      
      expect(result.length).toBe(2);
      
      const merchant2Settlement = result.find(s => s.merchantId === 'merchant-2');
      expect(merchant2Settlement?.grossAmount).toBe(0);
      expect(merchant2Settlement?.totalRefunds).toBe(100);
      expect(merchant2Settlement?.netAmount).toBe(-100);
    });

    it('should calculate risk levels for all merchants', () => {
      const transactions: Transaction[] = [
        {
          id: 'pay-1',
          merchantId: 'merchant-1',
          type: TransactionType.PAYMENT,
          amount: 1000,
          status: TransactionStatus.APPROVED,
          createdAt: new Date()
        },
        {
          id: 'pay-2',
          merchantId: 'merchant-2',
          type: TransactionType.PAYMENT,
          amount: 1000,
          status: TransactionStatus.APPROVED,
          createdAt: new Date()
        },
        {
          id: 'cb-1',
          merchantId: 'merchant-2',
          type: TransactionType.CHARGEBACK,
          amount: 500,
          status: TransactionStatus.APPROVED,
          createdAt: new Date(),
          originalTransactionId: 'pay-2'
        }
      ];

      const result = generateDailySettlements(transactions, new Map(), new Map());
      
      expect(result.length).toBe(2);
      
      const merchant1Settlement = result.find(s => s.merchantId === 'merchant-1');
      const merchant2Settlement = result.find(s => s.merchantId === 'merchant-2');
      
      expect(merchant1Settlement?.riskLevel).toBe('LOW');
      expect(merchant2Settlement?.riskLevel).toBe('HIGH');
    });

    it('should handle complex multi-merchant scenario', () => {
      const transactions: Transaction[] = [
        {
          id: 'pay-1',
          merchantId: 'merchant-1',
          type: TransactionType.PAYMENT,
          amount: 5000,
          status: TransactionStatus.APPROVED,
          createdAt: new Date()
        },
        {
          id: 'pay-2',
          merchantId: 'merchant-1',
          type: TransactionType.PAYMENT,
          amount: 3000,
          status: TransactionStatus.APPROVED,
          createdAt: new Date()
        },
        {
          id: 'pay-3',
          merchantId: 'merchant-2',
          type: TransactionType.PAYMENT,
          amount: 2000,
          status: TransactionStatus.APPROVED,
          createdAt: new Date()
        },
        {
          id: 'refund-1',
          merchantId: 'merchant-1',
          type: TransactionType.REFUND,
          amount: 1000,
          status: TransactionStatus.APPROVED,
          createdAt: new Date(),
          originalTransactionId: 'pay-1'
        },
        {
          id: 'cb-1',
          merchantId: 'merchant-2',
          type: TransactionType.CHARGEBACK,
          amount: 500,
          status: TransactionStatus.APPROVED,
          createdAt: new Date(),
          originalTransactionId: 'pay-3'
        }
      ];
      const paymentFees = new Map([
        ['pay-1', 250],
        ['pay-2', 150],
        ['pay-3', 100],
        ['refund-1', 50]
      ]);
      const chargebackPenalties = new Map([['cb-1', 15]]);

      const result = generateDailySettlements(transactions, paymentFees, chargebackPenalties);
      
      expect(result.length).toBe(2);
      
      const merchant1Settlement = result.find(s => s.merchantId === 'merchant-1');
      expect(merchant1Settlement?.grossAmount).toBe(8000);
      expect(merchant1Settlement?.totalFees).toBe(350); // 250 + 150 - 50
      expect(merchant1Settlement?.totalRefunds).toBe(1000);
      expect(merchant1Settlement?.netAmount).toBe(6650);
      
      const merchant2Settlement = result.find(s => s.merchantId === 'merchant-2');
      expect(merchant2Settlement?.grossAmount).toBe(2000);
      expect(merchant2Settlement?.totalFees).toBe(100);
      expect(merchant2Settlement?.totalChargebacks).toBe(500);
      expect(merchant2Settlement?.totalPenalties).toBe(15);
      expect(merchant2Settlement?.netAmount).toBe(1385);
    });

    it('should return settlements array with correct length', () => {
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
          merchantId: 'merchant-3',
          type: TransactionType.PAYMENT,
          amount: 300,
          status: TransactionStatus.APPROVED,
          createdAt: new Date()
        },
        {
          id: 'pay-4',
          merchantId: 'merchant-4',
          type: TransactionType.PAYMENT,
          amount: 400,
          status: TransactionStatus.APPROVED,
          createdAt: new Date()
        },
        {
          id: 'pay-5',
          merchantId: 'merchant-5',
          type: TransactionType.PAYMENT,
          amount: 500,
          status: TransactionStatus.APPROVED,
          createdAt: new Date()
        }
      ];

      const result = generateDailySettlements(transactions, new Map(), new Map());
      
      expect(result.length).toBe(5);
    });
  });
});
