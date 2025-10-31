import { IDatabase } from '../database/';
import { TransactionManager } from '../transactions/TransactionManager';

export abstract class DBAdapter<T> implements IDatabase {
  protected instance: T | null = null;
  protected maxRetries: number;
  protected retryDelay: number;
  protected transactionManager: TransactionManager;

  constructor(
    transactionManager: TransactionManager,
    maxRetries: number = 5,
    retryDelay: number = 1000
  ) {
    this.transactionManager = transactionManager;
    this.maxRetries = maxRetries;
    this.retryDelay = retryDelay;
  }

  async initialize(): Promise<void> {
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        this.instance = this.createInstance();
        await this.testConnection();
        return; // Success!
      } catch (error) {
        if (attempt === this.maxRetries - 1) throw error;
        const delay = this.retryDelay * Math.pow(2, attempt); // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  getInstance(): T | null {
    return this.instance;
  }

  protected abstract createInstance(): T;
  protected abstract testConnection(): Promise<void>;

  abstract query<T = any>(sql: string, params?: any[]): Promise<T>;
  abstract close(): Promise<void>;

  // Helper method to get current transaction or connection
  protected getConnection() {
    // Check if we're in a transaction
    const trx = this.transactionManager.getCurrentTransaction();
    return trx || this.instance;
  }
}