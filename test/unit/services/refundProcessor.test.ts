import { processRefund, isWithinFullRefundWindow, calculateDaysDifference } from '../../../src/services/refundProcessor';
import { Transaction, TransactionStatus, TransactionType } from '../../../src/models';

describe('Refund Processor', () => {
  const originalPayment: Transaction = {
    id: 'pay-1',
    merchantId: 'merchant-1',
    type: TransactionType.PAYMENT,
    amount: 100,
    status: TransactionStatus.APPROVED,
    createdAt: new Date('2025-01-01')
  };

  describe('processRefund', () => {
    it('should not throw error for valid refund within window', () => {
      const refund: Transaction = {
        id: 'refund-1',
        merchantId: 'merchant-1',
        type: TransactionType.REFUND,
        amount: 50,
        status: TransactionStatus.APPROVED,
        createdAt: new Date('2025-01-05'),
        originalTransactionId: 'pay-1'
      };

      expect(() => processRefund(refund, originalPayment, 5)).not.toThrow();
    });

    it('should not throw error for valid refund after window', () => {
      const refund: Transaction = {
        id: 'refund-1',
        merchantId: 'merchant-1',
        type: TransactionType.REFUND,
        amount: 50,
        status: TransactionStatus.APPROVED,
        createdAt: new Date('2025-01-15'),
        originalTransactionId: 'pay-1'
      };

      expect(() => processRefund(refund, originalPayment, 5)).not.toThrow();
    });

    it('should return a ProcessedRefund object', () => {
      const refund: Transaction = {
        id: 'refund-1',
        merchantId: 'merchant-1',
        type: TransactionType.REFUND,
        amount: 50,
        status: TransactionStatus.APPROVED,
        createdAt: new Date('2025-01-05'),
        originalTransactionId: 'pay-1'
      };

      const result = processRefund(refund, originalPayment, 5);
      expect(result).toHaveProperty('refundTransactionId');
      expect(result).toHaveProperty('originalPaymentId');
      expect(result).toHaveProperty('refundAmount');
      expect(result).toHaveProperty('feeReturned');
    });

    it('should have correct refundTransactionId', () => {
      const refund: Transaction = {
        id: 'refund-123',
        merchantId: 'merchant-1',
        type: TransactionType.REFUND,
        amount: 50,
        status: TransactionStatus.APPROVED,
        createdAt: new Date('2025-01-05'),
        originalTransactionId: 'pay-1'
      };

      const result = processRefund(refund, originalPayment, 5);
      expect(result.refundTransactionId).toBe('refund-123');
    });

    it('should return totalRefundAmount as number', () => {
      const refund: Transaction = {
        id: 'refund-1',
        merchantId: 'merchant-1',
        type: TransactionType.REFUND,
        amount: 50,
        status: TransactionStatus.APPROVED,
        createdAt: new Date('2025-01-05'),
        originalTransactionId: 'pay-1'
      };

      const result = processRefund(refund, originalPayment, 5);
      expect(typeof result.totalRefundAmount).toBe('number');
      expect(result.totalRefundAmount).toBeGreaterThan(0);
    });

    it('should have isFullRefund property', () => {
      const refund: Transaction = {
        id: 'refund-1',
        merchantId: 'merchant-1',
        type: TransactionType.REFUND,
        amount: 50,
        status: TransactionStatus.APPROVED,
        createdAt: new Date('2025-01-05'),
        originalTransactionId: 'pay-1'
      };

      const result = processRefund(refund, originalPayment, 5);
      expect(result).toHaveProperty('isFullRefund');
      expect(typeof result.isFullRefund).toBe('boolean');
    });

    it('should return object with large refund amount', () => {
      const refund: Transaction = {
        id: 'refund-1',
        merchantId: 'merchant-1',
        type: TransactionType.REFUND,
        amount: 99,
        status: TransactionStatus.APPROVED,
        createdAt: new Date('2025-01-05'),
        originalTransactionId: 'pay-1'
      };

      const result = processRefund(refund, originalPayment, 5);
      expect(result.refundAmount).toBe(99);
    });

    it('should handle small refund amount', () => {
      const refund: Transaction = {
        id: 'refund-1',
        merchantId: 'merchant-1',
        type: TransactionType.REFUND,
        amount: 0.01,
        status: TransactionStatus.APPROVED,
        createdAt: new Date('2025-01-05'),
        originalTransactionId: 'pay-1'
      };

      const result = processRefund(refund, originalPayment, 5);
      expect(result.refundAmount).toBeGreaterThan(0);
    });

    // Testes de limites exatos - dentro e fora da janela de 7 dias
    it('should return fee within 7 days exactly', () => {
      const refund: Transaction = {
        id: 'refund-1',
        merchantId: 'merchant-1',
        type: TransactionType.REFUND,
        amount: 100,
        status: TransactionStatus.APPROVED,
        createdAt: new Date('2025-01-08'), // exatamente 7 dias
        originalTransactionId: 'pay-1'
      };

      const result = processRefund(refund, originalPayment, 5);
      expect(result.feeReturned).toBe(5);
      expect(result.totalRefundAmount).toBe(105);
      expect(result.isFullRefund).toBe(true);
    });

    it('should not return fee at 8 days', () => {
      const refund: Transaction = {
        id: 'refund-1',
        merchantId: 'merchant-1',
        type: TransactionType.REFUND,
        amount: 100,
        status: TransactionStatus.APPROVED,
        createdAt: new Date('2025-01-09'), // exatamente 8 dias
        originalTransactionId: 'pay-1'
      };

      const result = processRefund(refund, originalPayment, 5);
      expect(result.feeReturned).toBe(0);
      expect(result.totalRefundAmount).toBe(100);
      expect(result.isFullRefund).toBe(false);
    });

    // Testes de arredondamento
    it('should round feeReturned correctly', () => {
      const refund: Transaction = {
        id: 'refund-1',
        merchantId: 'merchant-1',
        type: TransactionType.REFUND,
        amount: 50.33,
        status: TransactionStatus.APPROVED,
        createdAt: new Date('2025-01-05'),
        originalTransactionId: 'pay-1'
      };

      const result = processRefund(refund, originalPayment, 5.02);
      expect(result.feeReturned).toBe(5.02);
      expect(result.totalRefundAmount).toBe(55.35);
    });

    it('should round refundAmount to 2 decimals', () => {
      const refund: Transaction = {
        id: 'refund-1',
        merchantId: 'merchant-1',
        type: TransactionType.REFUND,
        amount: 33.333,
        status: TransactionStatus.APPROVED,
        createdAt: new Date('2025-01-05'),
        originalTransactionId: 'pay-1'
      };

      const result = processRefund(refund, originalPayment, 5);
      expect(result.refundAmount).toBe(33.33);
      expect(result.totalRefundAmount).toBe(38.33);
    });

    it('should handle complex decimal calculations', () => {
      const refund: Transaction = {
        id: 'refund-1',
        merchantId: 'merchant-1',
        type: TransactionType.REFUND,
        amount: 123.456,
        status: TransactionStatus.APPROVED,
        createdAt: new Date('2025-01-05'),
        originalTransactionId: 'pay-1'
      };

      const payment: Transaction = {
        ...originalPayment,
        amount: 200
      };

      const result = processRefund(refund, payment, 6.17);
      expect(result.refundAmount).toBe(123.46);
      expect(result.feeReturned).toBe(6.17);
      expect(result.totalRefundAmount).toBe(129.63);
    });

    // Testes com zero
    it('should handle zero refund amount', () => {
      const refund: Transaction = {
        id: 'refund-1',
        merchantId: 'merchant-1',
        type: TransactionType.REFUND,
        amount: 0,
        status: TransactionStatus.APPROVED,
        createdAt: new Date('2025-01-05'),
        originalTransactionId: 'pay-1'
      };

      const result = processRefund(refund, originalPayment, 5);
      expect(result.refundAmount).toBe(0);
      expect(result.feeReturned).toBe(5);
      expect(result.totalRefundAmount).toBe(5);
    });

    it('should handle zero fee', () => {
      const refund: Transaction = {
        id: 'refund-1',
        merchantId: 'merchant-1',
        type: TransactionType.REFUND,
        amount: 50,
        status: TransactionStatus.APPROVED,
        createdAt: new Date('2025-01-05'),
        originalTransactionId: 'pay-1'
      };

      const result = processRefund(refund, originalPayment, 0);
      expect(result.refundAmount).toBe(50);
      expect(result.feeReturned).toBe(0);
      expect(result.totalRefundAmount).toBe(50);
    });

    // Testes de erro
    it('should throw error when refund exceeds original payment', () => {
      const refund: Transaction = {
        id: 'refund-1',
        merchantId: 'merchant-1',
        type: TransactionType.REFUND,
        amount: 101,
        status: TransactionStatus.APPROVED,
        createdAt: new Date('2025-01-05'),
        originalTransactionId: 'pay-1'
      };

      expect(() => processRefund(refund, originalPayment, 5)).toThrow(
        'Refund amount (101) cannot exceed original payment amount (100)'
      );
    });

    it('should throw error when refund much larger than original', () => {
      const refund: Transaction = {
        id: 'refund-1',
        merchantId: 'merchant-1',
        type: TransactionType.REFUND,
        amount: 500,
        status: TransactionStatus.APPROVED,
        createdAt: new Date('2025-01-05'),
        originalTransactionId: 'pay-1'
      };

      expect(() => processRefund(refund, originalPayment, 5)).toThrow();
    });

    // Testes parametrizados para diferentes cenários de dias
    it.each([
      [0, 5, 55, true],   // mesmo dia - retorna fee
      [1, 5, 55, true],   // 1 dia - retorna fee
      [5, 5, 55, true],   // 5 dias - retorna fee
      [7, 5, 55, true],   // 7 dias - retorna fee
      [8, 0, 50, false],  // 8 dias - não retorna fee
      [10, 0, 50, false], // 10 dias - não retorna fee
      [30, 0, 50, false], // 30 dias - não retorna fee
    ])('should handle refund at %d days correctly', (daysAfter, expectedFee, expectedTotal, expectedFullRefund) => {
      const refundDate = new Date('2025-01-01');
      refundDate.setDate(refundDate.getDate() + daysAfter);

      const refund: Transaction = {
        id: 'refund-1',
        merchantId: 'merchant-1',
        type: TransactionType.REFUND,
        amount: 50,
        status: TransactionStatus.APPROVED,
        createdAt: refundDate,
        originalTransactionId: 'pay-1'
      };

      const result = processRefund(refund, originalPayment, 5);
      expect(result.feeReturned).toBe(expectedFee);
      expect(result.totalRefundAmount).toBe(expectedTotal);
      expect(result.isFullRefund).toBe(expectedFullRefund);
    });

    // Testes com valores extremos
    it('should handle large refund amounts', () => {
      const payment: Transaction = {
        ...originalPayment,
        amount: 9999999.99
      };

      const refund: Transaction = {
        id: 'refund-1',
        merchantId: 'merchant-1',
        type: TransactionType.REFUND,
        amount: 9999999.99,
        status: TransactionStatus.APPROVED,
        createdAt: new Date('2025-01-05'),
        originalTransactionId: 'pay-1'
      };

      const result = processRefund(refund, payment, 500000);
      expect(result.refundAmount).toBe(9999999.99);
      expect(result.feeReturned).toBe(500000);
      expect(result.totalRefundAmount).toBe(10499999.99);
    });
  });

  describe('isWithinFullRefundWindow', () => {
    it('should return boolean', () => {
      const refundDate = new Date('2025-01-05');
      const paymentDate = new Date('2025-01-01');
      const result = isWithinFullRefundWindow(refundDate, paymentDate);
      expect(typeof result).toBe('boolean');
    });

    it('should return true for refund on same day', () => {
      const date = new Date('2025-01-01');
      const result = isWithinFullRefundWindow(date, date);
      expect(result).toBe(true);
    });

    it('should return true for refund within 7 days', () => {
      const paymentDate = new Date('2025-01-01');
      const refundDate = new Date('2025-01-05');
      const result = isWithinFullRefundWindow(refundDate, paymentDate);
      expect(result).toBe(true);
    });

    it('should return false for refund well after 7 days', () => {
      const paymentDate = new Date('2025-01-01');
      const refundDate = new Date('2025-01-15');
      const result = isWithinFullRefundWindow(refundDate, paymentDate);
      expect(result).toBe(false);
    });

    it('should handle large time differences', () => {
      const paymentDate = new Date('2025-01-01');
      const refundDate = new Date('2025-12-31');
      const result = isWithinFullRefundWindow(refundDate, paymentDate);
      expect(typeof result).toBe('boolean');
    });

    // Testes de limites exatos - CRÍTICO
    it('should return true for refund exactly 7 days after', () => {
      const paymentDate = new Date('2025-01-01');
      const refundDate = new Date('2025-01-08');
      const result = isWithinFullRefundWindow(refundDate, paymentDate);
      expect(result).toBe(true);
    });

    it('should return false for refund exactly 8 days after', () => {
      const paymentDate = new Date('2025-01-01');
      const refundDate = new Date('2025-01-09');
      const result = isWithinFullRefundWindow(refundDate, paymentDate);
      expect(result).toBe(false);
    });

    it('should return true for 1 day difference', () => {
      const paymentDate = new Date('2025-01-01');
      const refundDate = new Date('2025-01-02');
      const result = isWithinFullRefundWindow(refundDate, paymentDate);
      expect(result).toBe(true);
    });

    it('should return true for 6 days difference', () => {
      const paymentDate = new Date('2025-01-01');
      const refundDate = new Date('2025-01-07');
      const result = isWithinFullRefundWindow(refundDate, paymentDate);
      expect(result).toBe(true);
    });

    // Testes parametrizados
    it.each([
      [0, true],
      [1, true],
      [3, true],
      [5, true],
      [7, true],
      [8, false],
      [10, false],
      [30, false],
    ])('should return correct result for %d days difference', (days, expected) => {
      const paymentDate = new Date('2025-01-01');
      const refundDate = new Date(paymentDate);
      refundDate.setDate(refundDate.getDate() + days);
      expect(isWithinFullRefundWindow(refundDate, paymentDate)).toBe(expected);
    });
  });

  describe('calculateDaysDifference', () => {
    it('should not throw error', () => {
      const date1 = new Date('2025-01-05');
      const date2 = new Date('2025-01-01');
      expect(() => calculateDaysDifference(date1, date2)).not.toThrow();
    });

    it('should return number', () => {
      const date1 = new Date('2025-01-05');
      const date2 = new Date('2025-01-01');
      const result = calculateDaysDifference(date1, date2);
      expect(typeof result).toBe('number');
    });

    it('should return positive difference', () => {
      const date1 = new Date('2025-01-05');
      const date2 = new Date('2025-01-01');
      const result = calculateDaysDifference(date1, date2);
      expect(result).toBeGreaterThan(0);
    });

    it('should return zero for same day', () => {
      const date = new Date('2025-01-01');
      const result = calculateDaysDifference(date, date);
      expect(result).toBe(0);
    });

    it('should return 4 for 4 days difference', () => {
      const date1 = new Date('2025-01-05');
      const date2 = new Date('2025-01-01');
      const result = calculateDaysDifference(date1, date2);
      expect(result).toBe(4);
    });

    // Testes de limites exatos
    it('should return exactly 7 for 7 days difference', () => {
      const date1 = new Date('2025-01-08');
      const date2 = new Date('2025-01-01');
      const result = calculateDaysDifference(date1, date2);
      expect(result).toBe(7);
    });

    it('should return exactly 8 for 8 days difference', () => {
      const date1 = new Date('2025-01-09');
      const date2 = new Date('2025-01-01');
      const result = calculateDaysDifference(date1, date2);
      expect(result).toBe(8);
    });

    it('should return 1 for 1 day difference', () => {
      const date1 = new Date('2025-01-02');
      const date2 = new Date('2025-01-01');
      const result = calculateDaysDifference(date1, date2);
      expect(result).toBe(1);
    });

    // Testes parametrizados
    it.each([
      [0, 0],
      [1, 1],
      [7, 7],
      [8, 8],
      [30, 30],
      [365, 365],
    ])('should return %d for %d days difference', (days, expected) => {
      const date1 = new Date('2025-01-01');
      const date2 = new Date(date1);
      date2.setDate(date2.getDate() + days);
      expect(calculateDaysDifference(date2, date1)).toBe(expected);
    });
  });
});
