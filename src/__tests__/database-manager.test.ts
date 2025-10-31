import { DatabaseManager } from '../database/DatabaseManager';
import { MockAdapter } from '../adapters/MockAdapter';

describe('DatabaseManager', () => {
  let manager: DatabaseManager;

  beforeEach(() => {
    manager = new DatabaseManager();
  });

  afterEach(async () => {
    await manager.close();
  });

  it('should create and initialize a database adapter', async () => {
    const db = await manager.createDatabase(MockAdapter, {});
    expect(db).toBeDefined();
  });

  it('should return the same database instance', async () => {
    const db1 = await manager.createDatabase(MockAdapter, {});
    const db2 = manager.getDatabase();
    expect(db1).toBe(db2);
  });

  it('should throw error when getting database before initialization', async () => {
    expect(() => manager.getDatabase()).toThrow('Database instance has not been created yet.');
  });

  it('should close the database', async () => {
    await manager.createDatabase(MockAdapter, {});
    await manager.close();
    expect(() => manager.getDatabase()).toThrow('Database instance has not been created yet.');
  });
});