import { IDatabase } from './IDatabase';
import { DBAdapter, MockAdapter, KnexAdapter} from '../adapters/';
import { TransactionManager } from '../transactions/TransactionManager';


enum DatabaseState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  READY = 'READY',
  ERROR = 'ERROR',
  CLOSED = 'CLOSED',
}

export class DatabaseManager {
  private instance: IDatabase | null = null;
  private state: DatabaseState = DatabaseState.UNINITIALIZED;
  private initializationError: Error | null = null;
  private readonly maxRetries: number;
  private readonly retryDelay: number;

  constructor(maxRetries: number = 5, retryDelay: number = 1000) {
    this.maxRetries = maxRetries;
    this.retryDelay = retryDelay;
  }

  async createDatabase<T extends DBAdapter<any>>(
    AdapterClass: new (transactionManager: any, config: any, maxRetries?: number, retryDelay?: number) => T,
    transactionManager: any,
    config: any
  ): Promise<IDatabase> {
    if (this.state === DatabaseState.READY && this.instance) {
      return this.instance;
    }

    switch (this.state) {
      case DatabaseState.UNINITIALIZED:
        return await this.initializeDatabase(AdapterClass, transactionManager, config);

      case DatabaseState.INITIALIZING:
        return await this.waitForInitialization();

      case DatabaseState.READY:
        return this.instance!;

      case DatabaseState.ERROR:
        throw this.initializationError || new Error('Database initialization failed');

      case DatabaseState.CLOSED:
        this.state = DatabaseState.UNINITIALIZED;
        return await this.initializeDatabase(AdapterClass, transactionManager, config);

      default:
        throw new Error('Unknown database state');
    }
  }

  private async initializeDatabase<T extends DBAdapter<any>>(
    AdapterClass: new (transactionManager: any, config: any, maxRetries?: number, retryDelay?: number) => T,
    transactionManager: any,
    config: any
  ): Promise<IDatabase> {
    this.state = DatabaseState.INITIALIZING;
    try {
      const dbInstance = new AdapterClass(transactionManager, config, this.maxRetries, this.retryDelay);
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

  private async waitForInitialization(): Promise<IDatabase> {
    while (this.state === DatabaseState.INITIALIZING) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    if (this.state === DatabaseState.READY && this.instance) {
      return this.instance;
    }

    throw this.initializationError || new Error('Database initialization failed');
  }

  getDatabase(): IDatabase {
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
    // Create a mock transaction manager for tests
    const mockTxManager = {
      runInTransaction: async (operation: () => Promise<any>) => operation(),
      getCurrentTransaction: () => null
    } as TransactionManager;

    return manager.createDatabase(MockAdapter, mockTxManager, {});
  }

  // Default to KnexAdapter with PostgreSQL config
  const knexConfig = {
    client: 'postgresql',
    connection: process.env.DATABASE_URL || 'postgresql://localhost:5432/test',
  };

  // For now, create a basic transaction manager
  // This will be improved in the full implementation
  const basicTxManager = {
    runInTransaction: async (operation: () => Promise<any>) => operation(),
    getCurrentTransaction: () => null
  } as TransactionManager;

  return manager.createDatabase(KnexAdapter, basicTxManager, knexConfig);
}