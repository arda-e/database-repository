import knex, { Knex } from 'knex';
import { DBAdapter } from './DBAdapter';
import { TransactionManager } from '../transactions/TransactionManager';

export class KnexAdapter extends DBAdapter<Knex> {
  constructor(
    transactionManager: TransactionManager,
    private config: Knex.Config,
    maxRetries?: number,
    retryDelay?: number
  ) {
    super(transactionManager, maxRetries, retryDelay);
  }

  protected createInstance(): Knex {
    return knex(this.config);
  }

  protected async testConnection(): Promise<void> {
    await this.instance!.raw('SELECT 1');
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<T> {
    if (!this.instance) throw new Error('Database not initialized');

    const conn = this.getConnection();
    return conn.raw(sql, params) as Promise<T>;
  }

  async close(): Promise<void> {
    await this.instance?.destroy();
  }

  async beginTransaction() {
    if (!this.instance) throw new Error('Database not initialized');
    return this.instance.transaction();
  }
}