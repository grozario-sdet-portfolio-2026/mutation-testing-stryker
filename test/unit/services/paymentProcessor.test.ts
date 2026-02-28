import { processApprovedPayment, calculateFeeRate, calculatePaymentFee } from '../../../src/services/paymentProcessor';
import { Transaction, TransactionStatus, TransactionType } from '../../../src/models';

describe('Payment Processor', () => {
  describe('processApprovedPayment', () => {
    it('should not throw error for approved payment', () => {
      const transaction: Transaction = {
        id: 'pay-1',
        merchantId: 'merchant-1',
        type: TransactionType.PAYMENT,
        amount: 100,
        status: TransactionStatus.APPROVED,
        createdAt: new Date()
      };

      expect(() => processApprovedPayment(transaction, 0)).not.toThrow();
    });

    it('should return a ProcessedPayment object', () => {
      const transaction: Transaction = {
        id: 'pay-1',
        merchantId: 'merchant-1',
        type: TransactionType.PAYMENT,
        amount: 100,
        status: TransactionStatus.APPROVED,
        createdAt: new Date()
      };

      const result = processApprovedPayment(transaction, 0);
      expect(result).toHaveProperty('transactionId');
      expect(result).toHaveProperty('amount');
      expect(result).toHaveProperty('fee');
      expect(result).toHaveProperty('netAmount');
    });

    it('should return object with correct structure', () => {
      const transaction: Transaction = {
        id: 'pay-1',
        merchantId: 'merchant-1',
        type: TransactionType.PAYMENT,
        amount: 100,
        status: TransactionStatus.APPROVED,
        createdAt: new Date()
      };

      const result = processApprovedPayment(transaction, 0);
      expect(typeof result.transactionId).toBe('string');
      expect(typeof result.amount).toBe('number');
      expect(typeof result.fee).toBe('number');
      expect(typeof result.netAmount).toBe('number');
    });

    it('should return object with transactionId matching input', () => {
      const transaction: Transaction = {
        id: 'pay-123',
        merchantId: 'merchant-1',
        type: TransactionType.PAYMENT,
        amount: 100,
        status: TransactionStatus.APPROVED,
        createdAt: new Date()
      };

      const result = processApprovedPayment(transaction, 0);
      expect(result.transactionId).toBe('pay-123');
    });

    it('should return object with amount matching input', () => {
      const transaction: Transaction = {
        id: 'pay-1',
        merchantId: 'merchant-1',
        type: TransactionType.PAYMENT,
        amount: 500,
        status: TransactionStatus.APPROVED,
        createdAt: new Date()
      };

      const result = processApprovedPayment(transaction, 0);
      expect(result.amount).toBe(500);
    });

    it('should apply fee for low volume', () => {
      const transaction: Transaction = {
        id: 'pay-1',
        merchantId: 'merchant-1',
        type: TransactionType.PAYMENT,
        amount: 1000,
        status: TransactionStatus.APPROVED,
        createdAt: new Date()
      };

      const result = processApprovedPayment(transaction, 5000);
      expect(result.fee).toBeGreaterThan(0);
    });

    it('should have netAmount less than amount', () => {
      const transaction: Transaction = {
        id: 'pay-1',
        merchantId: 'merchant-1',
        type: TransactionType.PAYMENT,
        amount: 1000,
        status: TransactionStatus.APPROVED,
        createdAt: new Date()
      };

      const result = processApprovedPayment(transaction, 0);
      expect(result.netAmount).toBeLessThan(result.amount);
    });

    it('should work with large amounts', () => {
      const transaction: Transaction = {
        id: 'pay-1',
        merchantId: 'merchant-1',
        type: TransactionType.PAYMENT,
        amount: 999999,
        status: TransactionStatus.APPROVED,
        createdAt: new Date()
      };

      const result = processApprovedPayment(transaction, 0);
      expect(result.fee).toBeGreaterThan(0);
      expect(result.netAmount).toBeGreaterThan(0);
    });

    it('should work with small amounts', () => {
      const transaction: Transaction = {
        id: 'pay-1',
        merchantId: 'merchant-1',
        type: TransactionType.PAYMENT,
        amount: 0.01,
        status: TransactionStatus.APPROVED,
        createdAt: new Date()
      };

      const result = processApprovedPayment(transaction, 0);
      expect(result.netAmount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('calculateFeeRate', () => {
    it('should return a number', () => {
      const rate = calculateFeeRate(5000);
      expect(typeof rate).toBe('number');
    });

    it('should return positive number', () => {
      const rate = calculateFeeRate(5000);
      expect(rate).toBeGreaterThan(0);
    });

    it('should return fee rate for low volume', () => {
      const rate = calculateFeeRate(5000);
      expect(rate).toBeLessThan(1);
    });

    it('should return different rate for high volume', () => {
      const lowVolumeRate = calculateFeeRate(5000);
      const highVolumeRate = calculateFeeRate(20000);
      expect(lowVolumeRate).not.toBe(highVolumeRate);
    });
  });

  describe('calculatePaymentFee', () => {
    it('should not throw error', () => {
      expect(() => calculatePaymentFee(100, 0.05)).not.toThrow();
    });

    it('should return a number', () => {
      const fee = calculatePaymentFee(100, 0.05);
      expect(typeof fee).toBe('number');
    });

    it('should return positive fee for positive amount', () => {
      const fee = calculatePaymentFee(100, 0.05);
      expect(fee).toBeGreaterThan(0);
    });

    it('should return zero fee for zero amount', () => {
      const fee = calculatePaymentFee(0, 0.05);
      expect(fee).toBe(0);
    });

    it('should scale with amount', () => {
      const fee1 = calculatePaymentFee(100, 0.05);
      const fee2 = calculatePaymentFee(200, 0.05);
      expect(fee2).toBeGreaterThan(fee1);
    });
  });
});
