import { MockAdapter } from '../adapters/MockAdapter';
import { TransactionManager } from '../transactions/TransactionManager';

describe('MockAdapter', () => {
  let adapter: MockAdapter;
  let txManager: TransactionManager;

  beforeEach(async () => {
    txManager = new TransactionManager({} as any);
    adapter = new MockAdapter(txManager);
    await adapter.initialize();
  });

  afterEach(async () => {
    await adapter.close();
  });

  it('should initialize successfully', async () => {
    expect(adapter).toBeDefined();
  });

  it('should return seeded data for orders query', async () => {
    adapter.seed('orders', [
      { id: 1, status: 'pending' },
      { id: 2, status: 'completed' }
    ]);

    const result = await adapter.query('SELECT * FROM orders');
    expect(result).toEqual([
      { id: 1, status: 'pending' },
      { id: 2, status: 'completed' }
    ]);
  });

  it('should return empty array for non-orders query', async () => {
    const result = await adapter.query('SELECT * FROM users');
    expect(result).toEqual([]);
  });

  it('should clear data on close', async () => {
    adapter.seed('orders', [{ id: 1 }]);
    await adapter.close();

    // Create new adapter to test
    const newAdapter = new MockAdapter(txManager);
    await newAdapter.initialize();
    const result = await newAdapter.query('SELECT * FROM orders');
    expect(result).toEqual([]);
    await newAdapter.close();
  });
});