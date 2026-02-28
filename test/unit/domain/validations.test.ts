import {
  validateAmountNotNegative,
  validateDate,
  validateRefundHasValidPayment,
  validateChargebackHasValidApprovedPayment,
  validateChargebackReversedHasValidChargeback,
  validateRefundNotExceedsOriginal,
  validateTransaction,
  ValidationError
} from '../../../src/domain/validations';
import { Transaction, TransactionStatus, TransactionType } from '../../../src/models';

describe('Validations', () => {
  describe('validateAmountNotNegative', () => {
    it('should throw error when amount is negative', () => {
      expect(() => validateAmountNotNegative(-100)).toThrow(ValidationError);
      expect(() => validateAmountNotNegative(-100)).toThrow(
        'Transaction amount cannot be negative'
      );
    });

    it('should not throw error when amount is zero', () => {
      expect(() => validateAmountNotNegative(0)).not.toThrow();
    });

    it('should not throw error when amount is positive', () => {
      expect(() => validateAmountNotNegative(100)).not.toThrow();
      expect(() => validateAmountNotNegative(0.01)).not.toThrow();
    });

    // Testes de limites exatos - crítico
    it('should throw error for -0.01', () => {
      expect(() => validateAmountNotNegative(-0.01)).toThrow(ValidationError);
      expect(() => validateAmountNotNegative(-0.01)).toThrow(
        'Transaction amount cannot be negative'
      );
    });

    it('should throw error for very small negative number', () => {
      expect(() => validateAmountNotNegative(-0.001)).toThrow(ValidationError);
    });

    it('should not throw for very small positive number', () => {
      expect(() => validateAmountNotNegative(0.001)).not.toThrow();
    });

    it('should throw error for large negative number', () => {
      expect(() => validateAmountNotNegative(-9999999.99)).toThrow(ValidationError);
    });

    it('should not throw for large positive number', () => {
      expect(() => validateAmountNotNegative(9999999.99)).not.toThrow();
    });

    // Testes parametrizados
    it.each([
      [-1000, true],
      [-100, true],
      [-1, true],
      [-0.01, true],
      [0, false],
      [0.01, false],
      [1, false],
      [100, false],
      [1000, false],
    ])('should handle amount %f correctly', (amount, shouldThrow) => {
      if (shouldThrow) {
        expect(() => validateAmountNotNegative(amount)).toThrow(ValidationError);
      } else {
        expect(() => validateAmountNotNegative(amount)).not.toThrow();
      }
    });
  });

  describe('validateDate', () => {
    it('should throw error when date is invalid', () => {
      expect(() => validateDate(new Date('invalid'))).toThrow(ValidationError);
      expect(() => validateDate(new Date('invalid'))).toThrow('Invalid date format');
    });

    it('should throw error when date is not a Date object', () => {
      expect(() => validateDate('2025-01-01' as unknown as Date)).toThrow(ValidationError);
    });

    it('should not throw error when date is valid', () => {
      expect(() => validateDate(new Date())).not.toThrow();
      expect(() => validateDate(new Date('2025-01-01'))).not.toThrow();
    });
  });

  describe('validateRefundHasValidPayment', () => {
    const paymentTransaction: Transaction = {
      id: 'payment-1',
      merchantId: 'merchant-1',
      type: TransactionType.PAYMENT,
      amount: 100,
      status: TransactionStatus.APPROVED,
      createdAt: new Date('2025-01-01')
    };

    it('should throw error when refund has no originalTransactionId', () => {
      const refund: Transaction = {
        id: 'refund-1',
        merchantId: 'merchant-1',
        type: TransactionType.REFUND,
        amount: 50,
        status: TransactionStatus.APPROVED,
        createdAt: new Date('2025-01-05')
      };

      const payments = new Map([['payment-1', paymentTransaction]]);

      expect(() => validateRefundHasValidPayment(refund, payments)).toThrow(ValidationError);
      expect(() => validateRefundHasValidPayment(refund, payments)).toThrow(
        'Refund must have an originalTransactionId'
      );
    });

    it('should throw error when refund references non-existent payment', () => {
      const refund: Transaction = {
        id: 'refund-1',
        merchantId: 'merchant-1',
        type: TransactionType.REFUND,
        amount: 50,
        status: TransactionStatus.APPROVED,
        createdAt: new Date('2025-01-05'),
        originalTransactionId: 'non-existent'
      };

      const payments = new Map([['payment-1', paymentTransaction]]);

      expect(() => validateRefundHasValidPayment(refund, payments)).toThrow(ValidationError);
      expect(() => validateRefundHasValidPayment(refund, payments)).toThrow(
        'Refund references non-existent payment: non-existent'
      );
    });

    it('should throw error when refund references non-payment transaction', () => {
      const chargebackTransaction: Transaction = {
        id: 'chargeback-1',
        merchantId: 'merchant-1',
        type: TransactionType.CHARGEBACK,
        amount: 100,
        status: TransactionStatus.APPROVED,
        createdAt: new Date('2025-01-02'),
        originalTransactionId: 'payment-1'
      };

      const refund: Transaction = {
        id: 'refund-1',
        merchantId: 'merchant-1',
        type: TransactionType.REFUND,
        amount: 50,
        status: TransactionStatus.APPROVED,
        createdAt: new Date('2025-01-05'),
        originalTransactionId: 'chargeback-1'
      };

      const payments = new Map([
        ['payment-1', paymentTransaction],
        ['chargeback-1', chargebackTransaction]
      ]);

      expect(() => validateRefundHasValidPayment(refund, payments)).toThrow(ValidationError);
      expect(() => validateRefundHasValidPayment(refund, payments)).toThrow(
        'Refund must reference a payment, not chargeback'
      );
    });

    it('should not throw error when refund has valid payment reference', () => {
      const refund: Transaction = {
        id: 'refund-1',
        merchantId: 'merchant-1',
        type: TransactionType.REFUND,
        amount: 50,
        status: TransactionStatus.APPROVED,
        createdAt: new Date('2025-01-05'),
        originalTransactionId: 'payment-1'
      };

      const payments = new Map([['payment-1', paymentTransaction]]);

      expect(() => validateRefundHasValidPayment(refund, payments)).not.toThrow();
    });
  });

  describe('validateChargebackHasValidApprovedPayment', () => {
    const approvedPayment: Transaction = {
      id: 'payment-1',
      merchantId: 'merchant-1',
      type: TransactionType.PAYMENT,
      amount: 100,
      status: TransactionStatus.APPROVED,
      createdAt: new Date('2025-01-01')
    };

    const pendingPayment: Transaction = {
      id: 'payment-2',
      merchantId: 'merchant-1',
      type: TransactionType.PAYMENT,
      amount: 100,
      status: TransactionStatus.PENDING,
      createdAt: new Date('2025-01-01')
    };

    it('should throw error when chargeback has no originalTransactionId', () => {
      const chargeback: Transaction = {
        id: 'chargeback-1',
        merchantId: 'merchant-1',
        type: TransactionType.CHARGEBACK,
        amount: 100,
        status: TransactionStatus.APPROVED,
        createdAt: new Date('2025-01-02')
      };

      const payments = new Map([['payment-1', approvedPayment]]);

      expect(() => validateChargebackHasValidApprovedPayment(chargeback, payments)).toThrow(
        ValidationError
      );
      expect(() => validateChargebackHasValidApprovedPayment(chargeback, payments)).toThrow(
        'Chargeback must have an originalTransactionId'
      );
    });

    it('should throw error when chargeback references non-existent payment', () => {
      const chargeback: Transaction = {
        id: 'chargeback-1',
        merchantId: 'merchant-1',
        type: TransactionType.CHARGEBACK,
        amount: 100,
        status: TransactionStatus.APPROVED,
        createdAt: new Date('2025-01-02'),
        originalTransactionId: 'non-existent'
      };

      const payments = new Map([['payment-1', approvedPayment]]);

      expect(() => validateChargebackHasValidApprovedPayment(chargeback, payments)).toThrow(
        ValidationError
      );
      expect(() => validateChargebackHasValidApprovedPayment(chargeback, payments)).toThrow(
        'Chargeback references non-existent payment: non-existent'
      );
    });

    it('should throw error when chargeback references pending payment', () => {
      const chargeback: Transaction = {
        id: 'chargeback-1',
        merchantId: 'merchant-1',
        type: TransactionType.CHARGEBACK,
        amount: 100,
        status: TransactionStatus.APPROVED,
        createdAt: new Date('2025-01-02'),
        originalTransactionId: 'payment-2'
      };

      const payments = new Map([
        ['payment-1', approvedPayment],
        ['payment-2', pendingPayment]
      ]);

      expect(() => validateChargebackHasValidApprovedPayment(chargeback, payments)).toThrow(
        ValidationError
      );
      expect(() => validateChargebackHasValidApprovedPayment(chargeback, payments)).toThrow(
        'Chargeback must reference an approved payment'
      );
    });

    it('should not throw error when chargeback has valid approved payment reference', () => {
      const chargeback: Transaction = {
        id: 'chargeback-1',
        merchantId: 'merchant-1',
        type: TransactionType.CHARGEBACK,
        amount: 100,
        status: TransactionStatus.APPROVED,
        createdAt: new Date('2025-01-02'),
        originalTransactionId: 'payment-1'
      };

      const payments = new Map([['payment-1', approvedPayment]]);

      expect(() => validateChargebackHasValidApprovedPayment(chargeback, payments)).not.toThrow();
    });
  });

  describe('validateChargebackReversedHasValidChargeback', () => {
    const chargebackTransaction: Transaction = {
      id: 'chargeback-1',
      merchantId: 'merchant-1',
      type: TransactionType.CHARGEBACK,
      amount: 100,
      status: TransactionStatus.APPROVED,
      createdAt: new Date('2025-01-02'),
      originalTransactionId: 'payment-1'
    };

    it('should throw error when chargebackReversed has no originalTransactionId', () => {
      const cbReversed: Transaction = {
        id: 'cbr-1',
        merchantId: 'merchant-1',
        type: TransactionType.CHARGEBACK_REVERSED,
        amount: 100,
        status: TransactionStatus.APPROVED,
        createdAt: new Date('2025-01-03')
      };

      const allTransactions = new Map([['chargeback-1', chargebackTransaction]]);

      expect(() => validateChargebackReversedHasValidChargeback(cbReversed, allTransactions)).toThrow(ValidationError);
      expect(() => validateChargebackReversedHasValidChargeback(cbReversed, allTransactions)).toThrow(
        'ChargebackReversed must have an originalTransactionId'
      );
    });

    it('should throw error when chargebackReversed references non-existent chargeback', () => {
      const cbReversed: Transaction = {
        id: 'cbr-1',
        merchantId: 'merchant-1',
        type: TransactionType.CHARGEBACK_REVERSED,
        amount: 100,
        status: TransactionStatus.APPROVED,
        createdAt: new Date('2025-01-03'),
        originalTransactionId: 'non-existent'
      };

      const allTransactions = new Map([['chargeback-1', chargebackTransaction]]);

      expect(() => validateChargebackReversedHasValidChargeback(cbReversed, allTransactions)).toThrow(ValidationError);
      expect(() => validateChargebackReversedHasValidChargeback(cbReversed, allTransactions)).toThrow(
        'ChargebackReversed references non-existent chargeback: non-existent'
      );
    });

    it('should throw error when chargebackReversed references payment instead of chargeback', () => {
      const paymentTransaction: Transaction = {
        id: 'payment-1',
        merchantId: 'merchant-1',
        type: TransactionType.PAYMENT,
        amount: 100,
        status: TransactionStatus.APPROVED,
        createdAt: new Date('2025-01-01')
      };

      const cbReversed: Transaction = {
        id: 'cbr-1',
        merchantId: 'merchant-1',
        type: TransactionType.CHARGEBACK_REVERSED,
        amount: 100,
        status: TransactionStatus.APPROVED,
        createdAt: new Date('2025-01-03'),
        originalTransactionId: 'payment-1'
      };

      const allTransactions = new Map([
        ['payment-1', paymentTransaction],
        ['chargeback-1', chargebackTransaction]
      ]);

      expect(() => validateChargebackReversedHasValidChargeback(cbReversed, allTransactions)).toThrow(ValidationError);
      expect(() => validateChargebackReversedHasValidChargeback(cbReversed, allTransactions)).toThrow(
        'ChargebackReversed must reference a chargeback, not payment'
      );
    });

    it('should throw error when chargebackReversed references refund', () => {
      const refundTransaction: Transaction = {
        id: 'refund-1',
        merchantId: 'merchant-1',
        type: TransactionType.REFUND,
        amount: 50,
        status: TransactionStatus.APPROVED,
        createdAt: new Date('2025-01-02'),
        originalTransactionId: 'payment-1'
      };

      const cbReversed: Transaction = {
        id: 'cbr-1',
        merchantId: 'merchant-1',
        type: TransactionType.CHARGEBACK_REVERSED,
        amount: 100,
        status: TransactionStatus.APPROVED,
        createdAt: new Date('2025-01-03'),
        originalTransactionId: 'refund-1'
      };

      const allTransactions = new Map([
        ['refund-1', refundTransaction],
        ['chargeback-1', chargebackTransaction]
      ]);

      expect(() => validateChargebackReversedHasValidChargeback(cbReversed, allTransactions)).toThrow(ValidationError);
      expect(() => validateChargebackReversedHasValidChargeback(cbReversed, allTransactions)).toThrow(
        'ChargebackReversed must reference a chargeback, not refund'
      );
    });

    it('should not throw error when chargebackReversed has valid chargeback reference', () => {
      const cbReversed: Transaction = {
        id: 'cbr-1',
        merchantId: 'merchant-1',
        type: TransactionType.CHARGEBACK_REVERSED,
        amount: 100,
        status: TransactionStatus.APPROVED,
        createdAt: new Date('2025-01-03'),
        originalTransactionId: 'chargeback-1'
      };

      const allTransactions = new Map([['chargeback-1', chargebackTransaction]]);

      expect(() => validateChargebackReversedHasValidChargeback(cbReversed, allTransactions)).not.toThrow();
    });
  });

  describe('validateRefundNotExceedsOriginal', () => {
    it('should throw error when refund exceeds original amount', () => {
      expect(() => validateRefundNotExceedsOriginal(150, 100)).toThrow(ValidationError);
      expect(() => validateRefundNotExceedsOriginal(150, 100)).toThrow(
        'Refund amount (150) cannot exceed original payment amount (100)'
      );
    });

    it('should not throw error when refund equals original amount', () => {
      expect(() => validateRefundNotExceedsOriginal(100, 100)).not.toThrow();
    });

    it('should not throw error when refund is less than original amount', () => {
      expect(() => validateRefundNotExceedsOriginal(50, 100)).not.toThrow();
      expect(() => validateRefundNotExceedsOriginal(0, 100)).not.toThrow();
    });

    it('should work with decimal values', () => {
      expect(() => validateRefundNotExceedsOriginal(99.99, 100.00)).not.toThrow();
      expect(() => validateRefundNotExceedsOriginal(100.01, 100.00)).toThrow(ValidationError);
    });

    // Testes de limites exatos - crítico
    it('should not throw when refund exactly equals original', () => {
      expect(() => validateRefundNotExceedsOriginal(123.45, 123.45)).not.toThrow();
    });

    it('should throw when refund is just above original', () => {
      expect(() => validateRefundNotExceedsOriginal(100.01, 100)).toThrow(ValidationError);
    });

    it('should not throw when refund is just below original', () => {
      expect(() => validateRefundNotExceedsOriginal(99.99, 100)).not.toThrow();
    });

    it('should throw error with specific values in message', () => {
      expect(() => validateRefundNotExceedsOriginal(200, 150)).toThrow(
        'Refund amount (200) cannot exceed original payment amount (150)'
      );
    });

    it('should handle zero refund', () => {
      expect(() => validateRefundNotExceedsOriginal(0, 100)).not.toThrow();
    });

    it('should handle zero original', () => {
      expect(() => validateRefundNotExceedsOriginal(0, 0)).not.toThrow();
      expect(() => validateRefundNotExceedsOriginal(0.01, 0)).toThrow(ValidationError);
    });

    it('should handle very small differences', () => {
      expect(() => validateRefundNotExceedsOriginal(100.001, 100)).toThrow(ValidationError);
      expect(() => validateRefundNotExceedsOriginal(99.999, 100)).not.toThrow();
    });

    // Testes parametrizados
    it.each([
      [50, 100, false],
      [99, 100, false],
      [99.99, 100, false],
      [100, 100, false],
      [100.01, 100, true],
      [101, 100, true],
      [200, 100, true],
    ])('should validate refund %f against original %f correctly', (refund, original, shouldThrow) => {
      if (shouldThrow) {
        expect(() => validateRefundNotExceedsOriginal(refund, original)).toThrow(ValidationError);
      } else {
        expect(() => validateRefundNotExceedsOriginal(refund, original)).not.toThrow();
      }
    });
  });

  describe('validateTransaction', () => {
    const approvedPayment: Transaction = {
      id: 'payment-1',
      merchantId: 'merchant-1',
      type: TransactionType.PAYMENT,
      amount: 100,
      status: TransactionStatus.APPROVED,
      createdAt: new Date('2025-01-01')
    };

    it('should throw error when transaction has negative amount', () => {
      const invalidTransaction: Transaction = {
        id: 'tx-1',
        merchantId: 'merchant-1',
        type: TransactionType.PAYMENT,
        amount: -100,
        status: TransactionStatus.APPROVED,
        createdAt: new Date('2025-01-01')
      };

      expect(() => validateTransaction(invalidTransaction)).toThrow(ValidationError);
      expect(() => validateTransaction(invalidTransaction)).toThrow(
        'Transaction amount cannot be negative'
      );
    });

    it('should throw error when transaction has invalid date', () => {
      const invalidTransaction: Transaction = {
        id: 'tx-1',
        merchantId: 'merchant-1',
        type: TransactionType.PAYMENT,
        amount: 100,
        status: TransactionStatus.APPROVED,
        createdAt: new Date('invalid')
      };

      expect(() => validateTransaction(invalidTransaction)).toThrow(ValidationError);
      expect(() => validateTransaction(invalidTransaction)).toThrow('Invalid date format');
    });

    it('should validate refund with payment references', () => {
      const refund: Transaction = {
        id: 'refund-1',
        merchantId: 'merchant-1',
        type: TransactionType.REFUND,
        amount: 50,
        status: TransactionStatus.APPROVED,
        createdAt: new Date('2025-01-05'),
        originalTransactionId: 'non-existent'
      };

      const payments = new Map([['payment-1', approvedPayment]]);

      expect(() => validateTransaction(refund, payments)).toThrow(ValidationError);
      expect(() => validateTransaction(refund, payments)).toThrow(
        'Refund references non-existent payment'
      );
    });

    it('should validate chargeback with payment references', () => {
      const chargeback: Transaction = {
        id: 'cb-1',
        merchantId: 'merchant-1',
        type: TransactionType.CHARGEBACK,
        amount: 100,
        status: TransactionStatus.APPROVED,
        createdAt: new Date('2025-01-02'),
        originalTransactionId: 'non-existent'
      };

      const payments = new Map([['payment-1', approvedPayment]]);

      expect(() => validateTransaction(chargeback, payments)).toThrow(ValidationError);
      expect(() => validateTransaction(chargeback, payments)).toThrow(
        'Chargeback references non-existent payment'
      );
    });

    it('should validate chargebackReversed with payment references', () => {
      const cbReversed: Transaction = {
        id: 'cb-rev-1',
        merchantId: 'merchant-1',
        type: TransactionType.CHARGEBACK_REVERSED,
        amount: 100,
        status: TransactionStatus.APPROVED,
        createdAt: new Date('2025-01-03'),
        originalTransactionId: 'non-existent'
      };

      const payments = new Map([['payment-1', approvedPayment]]);
      const allTransactions = new Map([['payment-1', approvedPayment]]);

      expect(() => validateTransaction(cbReversed, payments, allTransactions)).toThrow(ValidationError);
    });

    it('should throw error when chargebackReversed references non-payment transaction', () => {
      const paymentTx: Transaction = {
        id: 'payment-2',
        merchantId: 'merchant-1',
        type: TransactionType.PAYMENT,
        amount: 100,
        status: TransactionStatus.APPROVED,
        createdAt: new Date('2025-01-02')
      };

      const cbReversed: Transaction = {
        id: 'cb-rev-1',
        merchantId: 'merchant-1',
        type: TransactionType.CHARGEBACK_REVERSED,
        amount: 100,
        status: TransactionStatus.APPROVED,
        createdAt: new Date('2025-01-03'),
        originalTransactionId: 'payment-2'
      };

      const payments = new Map([
        ['payment-1', approvedPayment],
        ['payment-2', paymentTx]
      ]);
      const allTransactions = new Map([
        ['payment-1', approvedPayment],
        ['payment-2', paymentTx]
      ]);

      expect(() => validateTransaction(cbReversed, payments, allTransactions)).toThrow(ValidationError);
      expect(() => validateTransaction(cbReversed, payments, allTransactions)).toThrow(
        'ChargebackReversed must reference a chargeback, not payment'
      );
    });

    it('should not throw error for valid payment transaction', () => {
      expect(() => validateTransaction(approvedPayment)).not.toThrow();
    });

    it('should not throw error for valid refund transaction', () => {
      const refund: Transaction = {
        id: 'refund-1',
        merchantId: 'merchant-1',
        type: TransactionType.REFUND,
        amount: 50,
        status: TransactionStatus.APPROVED,
        createdAt: new Date('2025-01-05'),
        originalTransactionId: 'payment-1'
      };

      const payments = new Map([['payment-1', approvedPayment]]);

      expect(() => validateTransaction(refund, payments)).not.toThrow();
    });

    it('should not throw error for valid chargeback transaction', () => {
      const chargeback: Transaction = {
        id: 'cb-1',
        merchantId: 'merchant-1',
        type: TransactionType.CHARGEBACK,
        amount: 100,
        status: TransactionStatus.APPROVED,
        createdAt: new Date('2025-01-02'),
        originalTransactionId: 'payment-1'
      };

      const payments = new Map([['payment-1', approvedPayment]]);

      expect(() => validateTransaction(chargeback, payments)).not.toThrow();
    });

    it('should not throw error for valid chargebackReversed transaction', () => {
      const cbReversed: Transaction = {
        id: 'cb-rev-1',
        merchantId: 'merchant-1',
        type: TransactionType.CHARGEBACK_REVERSED,
        amount: 100,
        status: TransactionStatus.APPROVED,
        createdAt: new Date('2025-01-03'),
        originalTransactionId: 'payment-1'
      };

      const payments = new Map([['payment-1', approvedPayment]]);

      expect(() => validateTransaction(cbReversed, payments)).not.toThrow();
    });

    it('should validate transactions without payment references when not needed', () => {
      const pendingPayment: Transaction = {
        id: 'payment-2',
        merchantId: 'merchant-1',
        type: TransactionType.PAYMENT,
        amount: 100,
        status: TransactionStatus.PENDING,
        createdAt: new Date('2025-01-01')
      };

      expect(() => validateTransaction(pendingPayment)).not.toThrow();
    });
  });
});
