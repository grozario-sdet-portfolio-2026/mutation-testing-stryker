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
  });
});
