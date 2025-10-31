import { DatabaseManager } from '../database/DatabaseManager';
import { MockAdapter } from '../adapters/MockAdapter';

class OrderService {
  constructor(private dbManager: DatabaseManager) {}

  async getPendingOrders() {
    const db = await this.dbManager.getDatabase();
    const result = await db.query('SELECT * FROM orders WHERE status = ?', ['pending']);
    return result.filter((order: any) => order.status === 'pending');
  }
}

describe('OrderService', () => {
  let dbManager: DatabaseManager;
  let service: OrderService;

  beforeEach(async () => {
    dbManager = new DatabaseManager();
    const mockAdapter = new MockAdapter();
    mockAdapter.seed('orders', [
      { id: 1, status: 'pending' },
      { id: 2, status: 'completed' },
      { id: 3, status: 'pending' }
    ]);
    await dbManager.createDatabase(MockAdapter, {});
    // Replace the created adapter with our seeded one
    (dbManager as any).instance = mockAdapter;
    service = new OrderService(dbManager);
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