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

    // Testes de valores exatos - crucial para detectar mutantes
    it('should apply fixed penalty of 15', () => {
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
      expect(result.penalty).toBe(15);
    });

    it('should calculate totalDeduction as chargebackAmount + penalty', () => {
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
      expect(result.chargebackAmount).toBe(100);
      expect(result.penalty).toBe(15);
      expect(result.totalDeduction).toBe(115);
    });

    // Testes de arredondamento
    it('should round chargebackAmount to 2 decimals', () => {
      const payment: Transaction = {
        id: 'pay-1',
        merchantId: 'merchant-1',
        type: TransactionType.PAYMENT,
        amount: 100.333,
        status: TransactionStatus.APPROVED,
        createdAt: new Date()
      };

      const chargeback: Transaction = {
        id: 'chargeback-1',
        merchantId: 'merchant-1',
        type: TransactionType.CHARGEBACK,
        amount: 100.333,
        status: TransactionStatus.APPROVED,
        createdAt: new Date(),
        originalTransactionId: 'pay-1'
      };

      const result = processChargeback(chargeback, payment);
      expect(result.chargebackAmount).toBe(100.33);
      expect(result.totalDeduction).toBe(115.33);
    });

    it('should handle complex decimal amounts', () => {
      const payment: Transaction = {
        id: 'pay-1',
        merchantId: 'merchant-1',
        type: TransactionType.PAYMENT,
        amount: 123.456,
        status: TransactionStatus.APPROVED,
        createdAt: new Date()
      };

      const chargeback: Transaction = {
        id: 'chargeback-1',
        merchantId: 'merchant-1',
        type: TransactionType.CHARGEBACK,
        amount: 123.456,
        status: TransactionStatus.APPROVED,
        createdAt: new Date(),
        originalTransactionId: 'pay-1'
      };

      const result = processChargeback(chargeback, payment);
      expect(result.chargebackAmount).toBe(123.46);
      expect(result.penalty).toBe(15);
      expect(result.totalDeduction).toBe(138.46);
    });

    // Casos de borda
    it('should handle zero amount payment', () => {
      const payment: Transaction = {
        id: 'pay-1',
        merchantId: 'merchant-1',
        type: TransactionType.PAYMENT,
        amount: 0,
        status: TransactionStatus.APPROVED,
        createdAt: new Date()
      };

      const chargeback: Transaction = {
        id: 'chargeback-1',
        merchantId: 'merchant-1',
        type: TransactionType.CHARGEBACK,
        amount: 0,
        status: TransactionStatus.APPROVED,
        createdAt: new Date(),
        originalTransactionId: 'pay-1'
      };

      const result = processChargeback(chargeback, payment);
      expect(result.chargebackAmount).toBe(0);
      expect(result.penalty).toBe(15);
      expect(result.totalDeduction).toBe(15);
    });

    // Testes parametrizados
    it.each([
      [100, 15, 115],
      [50, 15, 65],
      [1000, 15, 1015],
      [0.01, 15, 15.01],
      [99.99, 15, 114.99],
      [500.50, 15, 515.50],
    ])('should correctly calculate for amount %d', (amount, expectedPenalty, expectedTotal) => {
      const payment: Transaction = {
        id: 'pay-1',
        merchantId: 'merchant-1',
        type: TransactionType.PAYMENT,
        amount,
        status: TransactionStatus.APPROVED,
        createdAt: new Date()
      };

      const chargeback: Transaction = {
        id: 'chargeback-1',
        merchantId: 'merchant-1',
        type: TransactionType.CHARGEBACK,
        amount,
        status: TransactionStatus.APPROVED,
        createdAt: new Date(),
        originalTransactionId: 'pay-1'
      };

      const result = processChargeback(chargeback, payment);
      expect(result.penalty).toBe(expectedPenalty);
      expect(result.totalDeduction).toBe(expectedTotal);
    });

    // Testes com valores extremos
    it('should handle extremely large amounts', () => {
      const payment: Transaction = {
        id: 'pay-1',
        merchantId: 'merchant-1',
        type: TransactionType.PAYMENT,
        amount: 9999999.99,
        status: TransactionStatus.APPROVED,
        createdAt: new Date()
      };

      const chargeback: Transaction = {
        id: 'chargeback-1',
        merchantId: 'merchant-1',
        type: TransactionType.CHARGEBACK,
        amount: 9999999.99,
        status: TransactionStatus.APPROVED,
        createdAt: new Date(),
        originalTransactionId: 'pay-1'
      };

      const result = processChargeback(chargeback, payment);
      expect(result.chargebackAmount).toBe(9999999.99);
      expect(result.penalty).toBe(15);
      expect(result.totalDeduction).toBe(10000014.99);
    });

    it('should use original payment amount not chargeback amount', () => {
      const payment: Transaction = {
        id: 'pay-1',
        merchantId: 'merchant-1',
        type: TransactionType.PAYMENT,
        amount: 200,
        status: TransactionStatus.APPROVED,
        createdAt: new Date()
      };

      const chargeback: Transaction = {
        id: 'chargeback-1',
        merchantId: 'merchant-1',
        type: TransactionType.CHARGEBACK,
        amount: 50, // diferente do payment
        status: TransactionStatus.APPROVED,
        createdAt: new Date(),
        originalTransactionId: 'pay-1'
      };

      const result = processChargeback(chargeback, payment);
      expect(result.chargebackAmount).toBe(200); // deve usar o valor do payment
      expect(result.totalDeduction).toBe(215);
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

    // Testes de valores exatos
    it('should calculate totalReversed as chargebackAmountReversed + penaltyRemoved', () => {
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
      expect(result.penaltyRemoved).toBe(15);
      expect(result.totalReversed).toBe(115);
    });

    it('should return exact values for standard chargeback reversed', () => {
      const chargebackReversed: Transaction = {
        id: 'cbr-1',
        merchantId: 'merchant-1',
        type: TransactionType.CHARGEBACK_REVERSED,
        amount: 50,
        status: TransactionStatus.APPROVED,
        createdAt: new Date(),
        originalTransactionId: 'chargeback-1'
      };

      const result = processChargebackReversed(chargebackReversed, 50, 15);
      expect(result.chargebackAmountReversed).toBe(50);
      expect(result.penaltyRemoved).toBe(15);
      expect(result.totalReversed).toBe(65);
    });

    // Testes de arredondamento
    it('should round chargebackAmountReversed to 2 decimals', () => {
      const chargebackReversed: Transaction = {
        id: 'cbr-1',
        merchantId: 'merchant-1',
        type: TransactionType.CHARGEBACK_REVERSED,
        amount: 100.333,
        status: TransactionStatus.APPROVED,
        createdAt: new Date(),
        originalTransactionId: 'chargeback-1'
      };

      const result = processChargebackReversed(chargebackReversed, 100.333, 15);
      expect(result.chargebackAmountReversed).toBe(100.33);
      expect(result.totalReversed).toBe(115.33);
    });

    it('should handle complex decimal amounts', () => {
      const chargebackReversed: Transaction = {
        id: 'cbr-1',
        merchantId: 'merchant-1',
        type: TransactionType.CHARGEBACK_REVERSED,
        amount: 123.456,
        status: TransactionStatus.APPROVED,
        createdAt: new Date(),
        originalTransactionId: 'chargeback-1'
      };

      const result = processChargebackReversed(chargebackReversed, 123.456, 15);
      expect(result.chargebackAmountReversed).toBe(123.46);
      expect(result.penaltyRemoved).toBe(15);
      expect(result.totalReversed).toBe(138.46);
    });

    it('should round penalty correctly', () => {
      const chargebackReversed: Transaction = {
        id: 'cbr-1',
        merchantId: 'merchant-1',
        type: TransactionType.CHARGEBACK_REVERSED,
        amount: 100,
        status: TransactionStatus.APPROVED,
        createdAt: new Date(),
        originalTransactionId: 'chargeback-1'
      };

      const result = processChargebackReversed(chargebackReversed, 100, 15.555);
      expect(result.penaltyRemoved).toBe(15.56);
      expect(result.totalReversed).toBe(115.56);
    });

    // Casos de borda
    it('should handle zero chargeback amount', () => {
      const chargebackReversed: Transaction = {
        id: 'cbr-1',
        merchantId: 'merchant-1',
        type: TransactionType.CHARGEBACK_REVERSED,
        amount: 0,
        status: TransactionStatus.APPROVED,
        createdAt: new Date(),
        originalTransactionId: 'chargeback-1'
      };

      const result = processChargebackReversed(chargebackReversed, 0, 15);
      expect(result.chargebackAmountReversed).toBe(0);
      expect(result.penaltyRemoved).toBe(15);
      expect(result.totalReversed).toBe(15);
    });

    it('should handle zero penalty', () => {
      const chargebackReversed: Transaction = {
        id: 'cbr-1',
        merchantId: 'merchant-1',
        type: TransactionType.CHARGEBACK_REVERSED,
        amount: 100,
        status: TransactionStatus.APPROVED,
        createdAt: new Date(),
        originalTransactionId: 'chargeback-1'
      };

      const result = processChargebackReversed(chargebackReversed, 100, 0);
      expect(result.chargebackAmountReversed).toBe(100);
      expect(result.penaltyRemoved).toBe(0);
      expect(result.totalReversed).toBe(100);
    });

    it('should handle both zero values', () => {
      const chargebackReversed: Transaction = {
        id: 'cbr-1',
        merchantId: 'merchant-1',
        type: TransactionType.CHARGEBACK_REVERSED,
        amount: 0,
        status: TransactionStatus.APPROVED,
        createdAt: new Date(),
        originalTransactionId: 'chargeback-1'
      };

      const result = processChargebackReversed(chargebackReversed, 0, 0);
      expect(result.chargebackAmountReversed).toBe(0);
      expect(result.penaltyRemoved).toBe(0);
      expect(result.totalReversed).toBe(0);
    });

    // Testes parametrizados
    it.each([
      [100, 15, 115],
      [50, 15, 65],
      [1000, 15, 1015],
      [0.01, 15, 15.01],
      [99.99, 15, 114.99],
      [200, 20, 220],
    ])('should correctly calculate for amount %d and penalty %d', (amount, penalty, expectedTotal) => {
      const chargebackReversed: Transaction = {
        id: 'cbr-1',
        merchantId: 'merchant-1',
        type: TransactionType.CHARGEBACK_REVERSED,
        amount,
        status: TransactionStatus.APPROVED,
        createdAt: new Date(),
        originalTransactionId: 'chargeback-1'
      };

      const result = processChargebackReversed(chargebackReversed, amount, penalty);
      expect(result.totalReversed).toBe(expectedTotal);
    });

    // Testes com valores extremos
    it('should handle extremely large amounts', () => {
      const chargebackReversed: Transaction = {
        id: 'cbr-1',
        merchantId: 'merchant-1',
        type: TransactionType.CHARGEBACK_REVERSED,
        amount: 9999999.99,
        status: TransactionStatus.APPROVED,
        createdAt: new Date(),
        originalTransactionId: 'chargeback-1'
      };

      const result = processChargebackReversed(chargebackReversed, 9999999.99, 15);
      expect(result.chargebackAmountReversed).toBe(9999999.99);
      expect(result.penaltyRemoved).toBe(15);
      expect(result.totalReversed).toBe(10000014.99);
    });

    it('should handle missing originalTransactionId', () => {
      const chargebackReversed: Transaction = {
        id: 'cbr-1',
        merchantId: 'merchant-1',
        type: TransactionType.CHARGEBACK_REVERSED,
        amount: 100,
        status: TransactionStatus.APPROVED,
        createdAt: new Date()
      };

      const result = processChargebackReversed(chargebackReversed, 100, 15);
      expect(result.originalChargebackId).toBe('');
    });
  });
});
