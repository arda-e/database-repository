import { DBAdapter } from './DBAdapter';
import { TransactionManager } from '../transactions';

export class MockAdapter extends DBAdapter<Map<string, any[]>> {
  private data = new Map<string, any[]>();

  constructor(
    transactionManager: TransactionManager,
    maxRetries?: number,
    retryDelay?: number
  ) {
    super(transactionManager, maxRetries, retryDelay);
  }

  // Seed test data
  seed(table: string, rows: any[]) {
    this.data.set(table, rows);
  }

  protected createInstance() {
    return this.data;
  }

  protected async testConnection() {
    // Always succeeds
  }

  async query<T = any>(sql: string): Promise<T> {
    if (sql.includes('SELECT') && sql.includes('orders')) {
      return (this.data.get('orders') || []) as T;
    }
    return [] as T;
  }

  async close() {
    this.data.clear();
  }
}