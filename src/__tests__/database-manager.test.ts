import { DatabaseManager } from '../database/DatabaseManager';
import { MockAdapter } from '../adapters/MockAdapter';
import { TransactionManager } from '../transactions/TransactionManager';

describe('DatabaseManager', () => {
  let manager: DatabaseManager;

  beforeEach(() => {
    manager = new DatabaseManager();
  });

  afterEach(async () => {
    await manager.close();
  });

  it('should create and initialize a database adapter', async () => {
    const txManager = new TransactionManager({} as any);
    const db = await manager.createDatabase(MockAdapter, txManager, {});
    expect(db).toBeDefined();
  });

  it('should return the same database instance', async () => {
    const txManager = new TransactionManager({} as any);
    const db1 = await manager.createDatabase(MockAdapter, txManager, {});
    const db2 = manager.getDatabase();
    expect(db1).toBe(db2);
  });

  it('should throw error when getting database before initialization', async () => {
    expect(() => manager.getDatabase()).toThrow('Database instance has not been created yet.');
  });

  it('should close the database', async () => {
    const txManager = new TransactionManager({} as any);
    await manager.createDatabase(MockAdapter, txManager, {});
    await manager.close();
    expect(() => manager.getDatabase()).toThrow('Database instance has not been created yet.');
  });
});