import { DatabaseManager } from './database';

export class OrderService {
  constructor(private dbManager: DatabaseManager) {}

  async getPendingOrders() {
    const db = await this.dbManager.getDatabase();
    const result = await db.query('SELECT * FROM orders WHERE status = ?', ['pending']);
    return result.filter((order: any) => order.status === 'pending');
  }

  async getAllOrders() {
    const db = await this.dbManager.getDatabase();
    return db.query('SELECT * FROM orders');
  }
}