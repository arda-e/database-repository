import { Database } from './database';
import { DbAdapter } from './adapter';
import { KnexAdapter } from './knex-adapter';
import { MockAdapter } from './mock-adapter';
import { SqliteAdapter } from './sqlite-adapter';

enum DatabaseState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  READY = 'READY',
  ERROR = 'ERROR',
  CLOSED = 'CLOSED',
}

export class DatabaseManager {
  private instance: Database | null = null;
  private state: DatabaseState = DatabaseState.UNINITIALIZED;
  private initializationError: Error | null = null;
  private maxRetries: number;
  private retryDelay: number;

  constructor(maxRetries: number = 5, retryDelay: number = 1000) {
    this.maxRetries = maxRetries;
    this.retryDelay = retryDelay;
  }

  async createDatabase<T extends DbAdapter<any>>(
    AdapterClass: new (config: any, maxRetries?: number, retryDelay?: number) => T,
    config: any
  ): Promise<Database> {
    if (this.state === DatabaseState.READY && this.instance) {
      return this.instance;
    }

    switch (this.state) {
      case DatabaseState.UNINITIALIZED:
        return await this.initializeDatabase(AdapterClass, config);

      case DatabaseState.INITIALIZING:
        return await this.waitForInitialization();

      case DatabaseState.READY:
        return this.instance!;

      case DatabaseState.ERROR:
        throw this.initializationError || new Error('Database initialization failed');

      case DatabaseState.CLOSED:
        this.state = DatabaseState.UNINITIALIZED;
        return await this.initializeDatabase(AdapterClass, config);

      default:
        throw new Error('Unknown database state');
    }
  }

  private async initializeDatabase<T extends DbAdapter<any>>(
    AdapterClass: new (config: any, maxRetries?: number, retryDelay?: number) => T,
    config: any
  ): Promise<Database> {
    this.state = DatabaseState.INITIALIZING;
    try {
      const dbInstance = new AdapterClass(config, this.maxRetries, this.retryDelay);
      await dbInstance.initialize();
      this.instance = dbInstance;
      this.state = DatabaseState.READY;
      return this.instance;
    } catch (error) {
      this.state = DatabaseState.ERROR;
      this.initializationError = error as Error;
      throw new Error(`Database initialization failed: ${(error as Error).message}`);
    }
  }

  private async waitForInitialization(): Promise<Database> {
    while (this.state === DatabaseState.INITIALIZING) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    if (this.state === DatabaseState.READY && this.instance) {
      return this.instance;
    }

    throw this.initializationError || new Error('Database initialization failed');
  }

  getDatabase(): Database {
    if (this.state !== DatabaseState.READY || this.instance === null) {
      throw new Error('Database instance has not been created yet.');
    }
    return this.instance;
  }

  async close(): Promise<void> {
    if (this.instance) {
      await this.instance.close();
      this.instance = null;
      this.state = DatabaseState.CLOSED;
    }
  }

  getInitializationError(): Error | null {
    return this.initializationError;
  }
}

// Factory function for environment flexibility
export async function createDatabase() {
  const manager = new DatabaseManager();

  if (process.env.NODE_ENV === 'test') {
    return manager.createDatabase(MockAdapter, {});
  }

  // Default to KnexAdapter with PostgreSQL config
  const knexConfig = {
    client: 'postgresql',
    connection: process.env.DATABASE_URL || 'postgresql://localhost:5432/test',
  };

  return manager.createDatabase(KnexAdapter, knexConfig);
}