import { DBAdapter } from './DBAdapter';
import knex from 'knex';

export class SqliteAdapter extends DBAdapter<knex.Knex> {
  constructor(private config: { filename?: string }, maxRetries?: number, retryDelay?: number) {
    super(maxRetries, retryDelay);
  }

  protected createInstance(): knex.Knex {
    return knex({
      client: 'sqlite3',
      connection: {
        filename: this.config.filename || ':memory:'
      },
      useNullAsDefault: true
    });
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