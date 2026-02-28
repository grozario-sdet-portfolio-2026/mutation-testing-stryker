import { processApprovedPayment, calculateFeeRate, calculatePaymentFee, calculatePaymentNetAmount } from '../../../src/services/paymentProcessor';
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

    // Testes de casos de borda com amount = 0
    it('should handle zero amount payment', () => {
      const transaction: Transaction = {
        id: 'pay-1',
        merchantId: 'merchant-1',
        type: TransactionType.PAYMENT,
        amount: 0,
        status: TransactionStatus.APPROVED,
        createdAt: new Date()
      };

      const result = processApprovedPayment(transaction, 0);
      expect(result.amount).toBe(0);
      expect(result.fee).toBe(0);
      expect(result.netAmount).toBe(0);
    });

    // Testes para limites exatos de volume
    it('should apply 5% fee when volume is exactly 10000', () => {
      const transaction: Transaction = {
        id: 'pay-1',
        merchantId: 'merchant-1',
        type: TransactionType.PAYMENT,
        amount: 100,
        status: TransactionStatus.APPROVED,
        createdAt: new Date()
      };

      const result = processApprovedPayment(transaction, 10000);
      expect(result.fee).toBe(5);
      expect(result.netAmount).toBe(95);
    });

    it('should apply 4.2% fee when volume is exactly 10001', () => {
      const transaction: Transaction = {
        id: 'pay-1',
        merchantId: 'merchant-1',
        type: TransactionType.PAYMENT,
        amount: 100,
        status: TransactionStatus.APPROVED,
        createdAt: new Date()
      };

      const result = processApprovedPayment(transaction, 10001);
      expect(result.fee).toBe(4.2);
      expect(result.netAmount).toBe(95.8);
    });

    // Testes com valores decimais complexos e arredondamento
    it('should correctly round fee and netAmount with decimal amounts', () => {
      const transaction: Transaction = {
        id: 'pay-1',
        merchantId: 'merchant-1',
        type: TransactionType.PAYMENT,
        amount: 123.45,
        status: TransactionStatus.APPROVED,
        createdAt: new Date()
      };

      const result = processApprovedPayment(transaction, 0);
      expect(result.fee).toBe(6.17);
      expect(result.netAmount).toBe(117.28);
    });

    it('should correctly round with high volume rate', () => {
      const transaction: Transaction = {
        id: 'pay-1',
        merchantId: 'merchant-1',
        type: TransactionType.PAYMENT,
        amount: 123.45,
        status: TransactionStatus.APPROVED,
        createdAt: new Date()
      };

      const result = processApprovedPayment(transaction, 15000);
      expect(result.fee).toBe(5.18);
      expect(result.netAmount).toBe(118.27);
    });

    // Testes parametrizados para diferentes volumes e valores
    it.each([
      [100, 0, 5, 95],
      [100, 5000, 5, 95],
      [100, 10000, 5, 95],
      [100, 10001, 4.2, 95.8],
      [100, 20000, 4.2, 95.8],
      [1000, 0, 50, 950],
      [1000, 15000, 42, 958],
    ])('should correctly calculate for amount %d and volume %d', (amount, volume, expectedFee, expectedNet) => {
      const transaction: Transaction = {
        id: 'pay-1',
        merchantId: 'merchant-1',
        type: TransactionType.PAYMENT,
        amount,
        status: TransactionStatus.APPROVED,
        createdAt: new Date()
      };

      const result = processApprovedPayment(transaction, volume);
      expect(result.fee).toBe(expectedFee);
      expect(result.netAmount).toBe(expectedNet);
    });

    // Teste com valores extremamente altos
    it('should handle extremely high amounts with correct rounding', () => {
      const transaction: Transaction = {
        id: 'pay-1',
        merchantId: 'merchant-1',
        type: TransactionType.PAYMENT,
        amount: 9999999.99,
        status: TransactionStatus.APPROVED,
        createdAt: new Date()
      };

      const result = processApprovedPayment(transaction, 0);
      expect(result.fee).toBe(500000);
      expect(result.netAmount).toBe(9499999.99);
    });

    // Teste de erro para status não aprovado
    it('should throw error for pending payment', () => {
      const transaction: Transaction = {
        id: 'pay-1',
        merchantId: 'merchant-1',
        type: TransactionType.PAYMENT,
        amount: 100,
        status: TransactionStatus.PENDING,
        createdAt: new Date()
      };

      expect(() => processApprovedPayment(transaction, 0)).toThrow('Cannot process non-approved payment with status: pending');
    });

    it('should throw error for failed payment', () => {
      const transaction: Transaction = {
        id: 'pay-1',
        merchantId: 'merchant-1',
        type: TransactionType.PAYMENT,
        amount: 100,
        status: TransactionStatus.FAILED,
        createdAt: new Date()
      };

      expect(() => processApprovedPayment(transaction, 0)).toThrow('Cannot process non-approved payment with status: failed');
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

    // Testes de limites exatos - crucial para detectar mutantes
    it('should return 5% for volume exactly at 10000', () => {
      const rate = calculateFeeRate(10000);
      expect(rate).toBe(0.05);
    });

    it('should return 4.2% for volume exactly at 10001', () => {
      const rate = calculateFeeRate(10001);
      expect(rate).toBe(0.042);
    });

    it('should return 5% for volume below threshold', () => {
      const rate = calculateFeeRate(9999);
      expect(rate).toBe(0.05);
    });

    it('should return 4.2% for volume above threshold', () => {
      const rate = calculateFeeRate(15000);
      expect(rate).toBe(0.042);
    });

    it('should return 5% for zero volume', () => {
      const rate = calculateFeeRate(0);
      expect(rate).toBe(0.05);
    });

    // Testes parametrizados
    it.each([
      [0, 0.05],
      [5000, 0.05],
      [10000, 0.05],
      [10001, 0.042],
      [15000, 0.042],
      [100000, 0.042],
    ])('should return correct rate for volume %d', (volume, expectedRate) => {
      expect(calculateFeeRate(volume)).toBe(expectedRate);
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

    // Testes de arredondamento - crítico para detectar mutantes
    it('should round fee to 2 decimal places', () => {
      const fee = calculatePaymentFee(100.33, 0.05);
      expect(fee).toBe(5.02);
    });

    it('should correctly round up when needed', () => {
      const fee = calculatePaymentFee(100.99, 0.05);
      expect(fee).toBe(5.05);
    });

    it('should correctly round down when needed', () => {
      const fee = calculatePaymentFee(100.01, 0.05);
      expect(fee).toBe(5);
    });

    // Testes com valores decimais complexos
    it('should handle multiple decimal places in amount', () => {
      const fee = calculatePaymentFee(123.456, 0.05);
      expect(fee).toBe(6.17);
    });

    it('should handle multiple decimal places with high volume rate', () => {
      const fee = calculatePaymentFee(123.456, 0.042);
      expect(fee).toBe(5.19);
    });

    // Testes de valores exatos
    it('should calculate exact fee for 100 at 5%', () => {
      const fee = calculatePaymentFee(100, 0.05);
      expect(fee).toBe(5);
    });

    it('should calculate exact fee for 100 at 4.2%', () => {
      const fee = calculatePaymentFee(100, 0.042);
      expect(fee).toBe(4.2);
    });

    it('should calculate exact fee for 1000 at 5%', () => {
      const fee = calculatePaymentFee(1000, 0.05);
      expect(fee).toBe(50);
    });

    it('should calculate exact fee for 1000 at 4.2%', () => {
      const fee = calculatePaymentFee(1000, 0.042);
      expect(fee).toBe(42);
    });

    // Casos de borda com valores muito pequenos
    it('should handle very small amounts with rounding', () => {
      const fee = calculatePaymentFee(0.01, 0.05);
      expect(fee).toBe(0);
    });

    it('should handle amounts that result in sub-cent fees', () => {
      const fee = calculatePaymentFee(1, 0.05);
      expect(fee).toBe(0.05);
    });
  });

  describe('calculatePaymentNetAmount', () => {
    it('should calculate net amount correctly', () => {
      const netAmount = calculatePaymentNetAmount(100, 5);
      expect(netAmount).toBe(95);
    });

    it('should handle zero fee', () => {
      const netAmount = calculatePaymentNetAmount(100, 0);
      expect(netAmount).toBe(100);
    });

    it('should handle zero amount', () => {
      const netAmount = calculatePaymentNetAmount(0, 0);
      expect(netAmount).toBe(0);
    });

    it('should round to two decimal places', () => {
      const netAmount = calculatePaymentNetAmount(100.33, 5.02);
      expect(netAmount).toBe(95.31);
    });

    it('should handle decimal amounts and fees', () => {
      const netAmount = calculatePaymentNetAmount(123.45, 6.17);
      expect(netAmount).toBe(117.28);
    });

    it('should handle rounding edge cases', () => {
      const netAmount = calculatePaymentNetAmount(100.99, 5.05);
      expect(netAmount).toBe(95.94);
    });

    it('should correctly subtract fee from amount', () => {
      const netAmount = calculatePaymentNetAmount(1000, 50);
      expect(netAmount).toBe(950);
    });

    it('should handle very small results', () => {
      const netAmount = calculatePaymentNetAmount(1, 0.95);
      expect(netAmount).toBe(0.05);
    });

    it('should handle large amounts', () => {
      const netAmount = calculatePaymentNetAmount(9999999.99, 500000);
      expect(netAmount).toBe(9499999.99);
    });
  });
});
