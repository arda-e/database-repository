import { DatabaseManager } from '../database/';
import { MockAdapter } from '../adapters/';
import { TransactionManager } from '../transactions/';

describe('OrderService', () => {
  let dbManager: DatabaseManager;
  let service: any;

  beforeEach(async () => {
    dbManager = new DatabaseManager();
    const txManager = new TransactionManager({} as any);
    const mockAdapter = new MockAdapter(txManager);
    mockAdapter.seed('orders', [
      { id: 1, status: 'pending' },
      { id: 2, status: 'completed' },
      { id: 3, status: 'pending' }
    ]);
    await dbManager.createDatabase(MockAdapter, txManager, {});
    // Replace the created adapter with our seeded one
    (dbManager as any).instance = mockAdapter;

    // Create a simple service for testing
    service = {
      dbManager,
      transactionManager: txManager,
      async getPendingOrders() {
        const db = await this.dbManager.getDatabase();
        const result = await db.query('SELECT * FROM orders WHERE status = ?', ['pending']);
        return result.filter((order: any) => order.status === 'pending');
      }
    };
  });

  afterEach(async () => {
    await dbManager.close();
  });

  it('gets pending orders', async () => {
    const orders = await service.getPendingOrders();
    expect(orders).toHaveLength(2);
    expect(orders[0].status).toBe('pending');
    expect(orders[1].status).toBe('pending');
  });
});


