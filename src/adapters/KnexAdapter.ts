import knex, { Knex } from 'knex';
import { DBAdapter } from './DBAdapter';

export class KnexAdapter extends DBAdapter<Knex> {
  constructor(private config: Knex.Config, maxRetries?: number, retryDelay?: number) {
    super(maxRetries, retryDelay);
  }

  protected createInstance(): Knex {
    return knex(this.config);
  }

  protected async testConnection(): Promise<void> {
    await this.instance!.raw('SELECT 1');
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<T> {
    if (!this.instance) throw new Error('Database not initialized');
    return this.instance.raw(sql, params) as Promise<T>;
  }

  async close(): Promise<void> {
    await this.instance?.destroy();
  }
}