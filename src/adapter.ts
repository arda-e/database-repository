import { Database } from './database';

export abstract class DbAdapter<T> implements Database {
  protected instance: T | null = null;
  protected maxRetries: number;
  protected retryDelay: number;

  constructor(maxRetries: number = 5, retryDelay: number = 1000) {
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
}