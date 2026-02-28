import {
  validateAmountNotNegative,
  validateDate,
  validateRefundHasValidPayment,
  validateChargebackHasValidApprovedPayment,
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
