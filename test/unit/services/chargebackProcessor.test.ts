import { processChargeback, processChargebackReversed } from '../../../src/services/chargebackProcessor';
import { Transaction, TransactionStatus, TransactionType } from '../../../src/models';

describe('Chargeback Processor', () => {
  const originalPayment: Transaction = {
    id: 'pay-1',
    merchantId: 'merchant-1',
    type: TransactionType.PAYMENT,
    amount: 100,
    status: TransactionStatus.APPROVED,
    createdAt: new Date()
  };

  describe('processChargeback', () => {
    it('should not throw error for valid chargeback', () => {
      const chargeback: Transaction = {
        id: 'chargeback-1',
        merchantId: 'merchant-1',
        type: TransactionType.CHARGEBACK,
        amount: 100,
        status: TransactionStatus.APPROVED,
        createdAt: new Date(),
        originalTransactionId: 'pay-1'
      };

      expect(() => processChargeback(chargeback, originalPayment)).not.toThrow();
    });

    it('should return ProcessedChargeback object', () => {
      const chargeback: Transaction = {
        id: 'chargeback-1',
        merchantId: 'merchant-1',
        type: TransactionType.CHARGEBACK,
        amount: 100,
        status: TransactionStatus.APPROVED,
        createdAt: new Date(),
        originalTransactionId: 'pay-1'
      };

      const result = processChargeback(chargeback, originalPayment);
      expect(result).toHaveProperty('chargebackTransactionId');
      expect(result).toHaveProperty('originalPaymentId');
      expect(result).toHaveProperty('chargebackAmount');
      expect(result).toHaveProperty('penalty');
      expect(result).toHaveProperty('totalDeduction');
    });

    it('should return correct chargebackTransactionId', () => {
      const chargeback: Transaction = {
        id: 'chargeback-123',
        merchantId: 'merchant-1',
        type: TransactionType.CHARGEBACK,
        amount: 100,
        status: TransactionStatus.APPROVED,
        createdAt: new Date(),
        originalTransactionId: 'pay-1'
      };

      const result = processChargeback(chargeback, originalPayment);
      expect(result.chargebackTransactionId).toBe('chargeback-123');
    });

    it('should return chargebackAmount as number', () => {
      const chargeback: Transaction = {
        id: 'chargeback-1',
        merchantId: 'merchant-1',
        type: TransactionType.CHARGEBACK,
        amount: 100,
        status: TransactionStatus.APPROVED,
        createdAt: new Date(),
        originalTransactionId: 'pay-1'
      };

      const result = processChargeback(chargeback, originalPayment);
      expect(typeof result.chargebackAmount).toBe('number');
      expect(result.chargebackAmount).toBeGreaterThan(0);
    });

    it('should return penalty as number', () => {
      const chargeback: Transaction = {
        id: 'chargeback-1',
        merchantId: 'merchant-1',
        type: TransactionType.CHARGEBACK,
        amount: 100,
        status: TransactionStatus.APPROVED,
        createdAt: new Date(),
        originalTransactionId: 'pay-1'
      };

      const result = processChargeback(chargeback, originalPayment);
      expect(typeof result.penalty).toBe('number');
      expect(result.penalty).toBeGreaterThan(0);
    });

    it('should return totalDeduction greater than chargebackAmount', () => {
      const chargeback: Transaction = {
        id: 'chargeback-1',
        merchantId: 'merchant-1',
        type: TransactionType.CHARGEBACK,
        amount: 100,
        status: TransactionStatus.APPROVED,
        createdAt: new Date(),
        originalTransactionId: 'pay-1'
      };

      const result = processChargeback(chargeback, originalPayment);
      expect(result.totalDeduction).toBeGreaterThan(result.chargebackAmount);
    });

    it('should work with large payment amount', () => {
      const largePayment: Transaction = {
        id: 'pay-1',
        merchantId: 'merchant-1',
        type: TransactionType.PAYMENT,
        amount: 100000,
        status: TransactionStatus.APPROVED,
        createdAt: new Date()
      };

      const chargeback: Transaction = {
        id: 'chargeback-1',
        merchantId: 'merchant-1',
        type: TransactionType.CHARGEBACK,
        amount: 100000,
        status: TransactionStatus.APPROVED,
        createdAt: new Date(),
        originalTransactionId: 'pay-1'
      };

      const result = processChargeback(chargeback, largePayment);
      expect(result.totalDeduction).toBeGreaterThan(0);
    });

    it('should work with small payment amount', () => {
      const smallPayment: Transaction = {
        id: 'pay-1',
        merchantId: 'merchant-1',
        type: TransactionType.PAYMENT,
        amount: 0.01,
        status: TransactionStatus.APPROVED,
        createdAt: new Date()
      };

      const chargeback: Transaction = {
        id: 'chargeback-1',
        merchantId: 'merchant-1',
        type: TransactionType.CHARGEBACK,
        amount: 0.01,
        status: TransactionStatus.APPROVED,
        createdAt: new Date(),
        originalTransactionId: 'pay-1'
      };

      const result = processChargeback(chargeback, smallPayment);
      expect(result.totalDeduction).toBeGreaterThan(0);
    });
  });

  describe('processChargebackReversed', () => {
    it('should not throw error', () => {
      const chargebackReversed: Transaction = {
        id: 'cbr-1',
        merchantId: 'merchant-1',
        type: TransactionType.CHARGEBACK_REVERSED,
        amount: 100,
        status: TransactionStatus.APPROVED,
        createdAt: new Date(),
        originalTransactionId: 'chargeback-1'
      };

      expect(() => processChargebackReversed(chargebackReversed, 100, 15)).not.toThrow();
    });

    it('should return ProcessedChargebackReversed object', () => {
      const chargebackReversed: Transaction = {
        id: 'cbr-1',
        merchantId: 'merchant-1',
        type: TransactionType.CHARGEBACK_REVERSED,
        amount: 100,
        status: TransactionStatus.APPROVED,
        createdAt: new Date(),
        originalTransactionId: 'chargeback-1'
      };

      const result = processChargebackReversed(chargebackReversed, 100, 15);
      expect(result).toHaveProperty('chargebackReversedTransactionId');
      expect(result).toHaveProperty('originalChargebackId');
      expect(result).toHaveProperty('chargebackAmountReversed');
      expect(result).toHaveProperty('penaltyRemoved');
      expect(result).toHaveProperty('totalReversed');
    });

    it('should return correct chargebackReversedTransactionId', () => {
      const chargebackReversed: Transaction = {
        id: 'cbr-456',
        merchantId: 'merchant-1',
        type: TransactionType.CHARGEBACK_REVERSED,
        amount: 100,
        status: TransactionStatus.APPROVED,
        createdAt: new Date(),
        originalTransactionId: 'chargeback-1'
      };

      const result = processChargebackReversed(chargebackReversed, 100, 15);
      expect(result.chargebackReversedTransactionId).toBe('cbr-456');
    });

    it('should return chargebackAmountReversed matching input', () => {
      const chargebackReversed: Transaction = {
        id: 'cbr-1',
        merchantId: 'merchant-1',
        type: TransactionType.CHARGEBACK_REVERSED,
        amount: 100,
        status: TransactionStatus.APPROVED,
        createdAt: new Date(),
        originalTransactionId: 'chargeback-1'
      };

      const result = processChargebackReversed(chargebackReversed, 100, 15);
      expect(result.chargebackAmountReversed).toBe(100);
    });

    it('should return penaltyRemoved as number', () => {
      const chargebackReversed: Transaction = {
        id: 'cbr-1',
        merchantId: 'merchant-1',
        type: TransactionType.CHARGEBACK_REVERSED,
        amount: 100,
        status: TransactionStatus.APPROVED,
        createdAt: new Date(),
        originalTransactionId: 'chargeback-1'
      };

      const result = processChargebackReversed(chargebackReversed, 100, 15);
      expect(typeof result.penaltyRemoved).toBe('number');
      expect(result.penaltyRemoved).toBeGreaterThan(0);
    });

    it('should return totalReversed greater than chargebackAmountReversed', () => {
      const chargebackReversed: Transaction = {
        id: 'cbr-1',
        merchantId: 'merchant-1',
        type: TransactionType.CHARGEBACK_REVERSED,
        amount: 100,
        status: TransactionStatus.APPROVED,
        createdAt: new Date(),
        originalTransactionId: 'chargeback-1'
      };

      const result = processChargebackReversed(chargebackReversed, 100, 15);
      expect(result.totalReversed).toBeGreaterThan(result.chargebackAmountReversed);
    });

    it('should work with large amounts', () => {
      const chargebackReversed: Transaction = {
        id: 'cbr-1',
        merchantId: 'merchant-1',
        type: TransactionType.CHARGEBACK_REVERSED,
        amount: 100000,
        status: TransactionStatus.APPROVED,
        createdAt: new Date(),
        originalTransactionId: 'chargeback-1'
      };

      const result = processChargebackReversed(chargebackReversed, 100000, 15);
      expect(result.totalReversed).toBeGreaterThan(0);
    });
  });
});
