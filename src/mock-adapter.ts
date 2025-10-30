import { DbAdapter } from './adapter';

export class MockAdapter extends DbAdapter<Map<string, any[]>> {
  private data = new Map<string, any[]>();

  constructor(maxRetries?: number, retryDelay?: number) {
    super(maxRetries, retryDelay);
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