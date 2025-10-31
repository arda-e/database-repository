import { AsyncLocalStorage } from 'async_hooks';
import { IDatabase } from '../database/';

interface TransactionContext {
  transaction: any; // Database transaction object
}

const transactionStorage = new AsyncLocalStorage<TransactionContext>();

export class TransactionManager {
  constructor(private dbAdapter: IDatabase) {}

  async runInTransaction<T>(
    operation: () => Promise<T>
  ): Promise<T> {
    // Check if we're already in a transaction
    const existingContext = transactionStorage.getStore();

    if (existingContext) {
      // Already in a transaction, just run the operation
      return operation();
    }

    // Start new transaction
    const trx = await this.beginTransaction();
    const context: TransactionContext = {
      transaction: trx
    };

    try {
      // Run operation with transaction context
      const result = await transactionStorage.run(
        context,
        operation
      );

      await trx.commit();
      return result;
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  getCurrentTransaction() {
    const context = transactionStorage.getStore();
    return context?.transaction;
  }

  private async beginTransaction() {
    // Use the database adapter to start a transaction
    if (this.dbAdapter.beginTransaction) {
      return this.dbAdapter.beginTransaction();
    }
    throw new Error('Database adapter does not support transactions');
  }
}