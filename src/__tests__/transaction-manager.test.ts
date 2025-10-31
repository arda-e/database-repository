import { Transactional, TransactionManager } from '../transactions/';

describe('SimpleTransactionManager', () => {
  let transactionManager: TransactionManager;
  let mockDbAdapter: any;
  let mockTransaction: any;

  beforeEach(() => {
    mockTransaction = {
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined)
    };

    mockDbAdapter = {
      query: jest.fn(),
      close: jest.fn(),
      beginTransaction: jest.fn().mockResolvedValue(mockTransaction)
    };
    
    transactionManager = new TransactionManager(mockDbAdapter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('basic functionality', () => {
    it('should create a transaction manager with a database adapter', () => {
      expect(transactionManager).toBeDefined();
      expect(transactionManager['dbAdapter']).toBe(mockDbAdapter);
    });

    it('should return undefined when no transaction is active', () => {
      const tx = transactionManager.getCurrentTransaction();
      expect(tx).toBeUndefined();
    });

    it('should execute functions with transaction context', async () => {
      const testFn = jest.fn().mockResolvedValue('test result');
      
      const result = await transactionManager.runInTransaction(testFn);
      
      expect(result).toBe('test result');
      expect(mockDbAdapter.beginTransaction).toHaveBeenCalledTimes(1);
    });

    it('should handle successful transaction flow', async () => {
      const testFn = jest.fn().mockResolvedValue('success');
      
      const result = await transactionManager.runInTransaction(testFn);
      
      expect(result).toBe('success');
      expect(mockDbAdapter.beginTransaction).toHaveBeenCalledTimes(1);
      expect(mockTransaction.commit).toHaveBeenCalledTimes(1);
      expect(mockTransaction.rollback).not.toHaveBeenCalled();
    });

    it('should handle transaction errors and rollback', async () => {
      const error = new Error('test error');
      const testFn = jest.fn().mockRejectedValue(error);
      
      await expect(transactionManager.runInTransaction(testFn)).rejects.toThrow('test error');
      
      expect(mockDbAdapter.beginTransaction).toHaveBeenCalledTimes(1);
      expect(mockTransaction.commit).not.toHaveBeenCalled();
      expect(mockTransaction.rollback).toHaveBeenCalledTimes(1);
    });
  });

  describe('transaction context', () => {
    it('should provide transaction context within transaction', async () => {
      await transactionManager.runInTransaction(async () => {
        const tx = transactionManager.getCurrentTransaction();
        expect(tx).toBeDefined();
        expect(tx).toBe(mockTransaction);
      });
    });

    it('should clear transaction context after completion', async () => {
      await transactionManager.runInTransaction(async () => {
        const tx = transactionManager.getCurrentTransaction();
        expect(tx).toBeDefined();
      });

      // After transaction completion
      const tx = transactionManager.getCurrentTransaction();
      expect(tx).toBeUndefined();
    });
  });

  describe('simple nested transactions (no savepoints)', () => {
    it('should handle nested calls by just running the operation', async () => {
      await transactionManager.runInTransaction(async () => {
        const outerTx = transactionManager.getCurrentTransaction();
        expect(outerTx).toBe(mockTransaction);

        // Call nested transaction - should just run the operation
        await transactionManager.runInTransaction(async () => {
          const innerTx = transactionManager.getCurrentTransaction();
          expect(innerTx).toBe(mockTransaction); // Same transaction!
        });
      });

      expect(mockDbAdapter.beginTransaction).toHaveBeenCalledTimes(1); // Only once!
      expect(mockTransaction.commit).toHaveBeenCalledTimes(1); // Only once!
    });
  });

  describe('SimpleTransactional decorator', () => {
    let mockTransactionManager: TransactionManager;

    beforeEach(() => {
      mockTransactionManager = {
        runInTransaction: jest.fn().mockImplementation((fn) => fn()),
        getCurrentTransaction: jest.fn().mockReturnValue(mockTransaction)
      } as any;
    });

    it('should create a decorator that wraps the original method', () => {
      class TestService {
        constructor(public transactionManager: TransactionManager) {}

        @Transactional()
        async testMethod() {
          return 'original result';
        }
      }

      const service = new TestService(mockTransactionManager);
      expect(typeof service.testMethod).toBe('function');
    });

    it('should call runInTransaction when the decorated method is invoked', async () => {
      mockTransactionManager.runInTransaction = jest.fn().mockResolvedValue('test result');

      class TestService {
        constructor(public transactionManager: TransactionManager) {}

        @Transactional()
        async testMethod() {
          return 'original result';
        }
      }

      const service = new TestService(mockTransactionManager);
      const result = await service.testMethod();

      expect(result).toBe('test result');
      expect(mockTransactionManager.runInTransaction).toHaveBeenCalled();
    });

    it('should throw error when transactionManager property is missing', async () => {
      class TestService {
        @Transactional()
        async testMethod() {
          return 'test';
        }
      }

      const service = new TestService();

      await expect(service.testMethod()).rejects.toThrow(
        '@SimpleTransactional requires transactionManager property'
      );
    });

    it('should preserve the original method context', async () => {
      mockTransactionManager.runInTransaction = jest.fn().mockImplementation((fn) => fn());

      class TestService {
        constructor(public transactionManager: TransactionManager) {}

        @Transactional()
        async testMethod() {
          return this.transactionManager;
        }
      }

      const service = new TestService(mockTransactionManager);
      const result = await service.testMethod();

      expect(result).toBe(mockTransactionManager);
    });
  });
});